// src/services/ChatbotService.ts

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient } from '@supabase/supabase-js';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableMap,
} from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import type { Document } from '@langchain/core/documents';

// Import Winston types for explicit typing
import { Logger as WinstonLogger } from 'winston';

// Import necessary local services, DTOs, and utilities
import { MessageService } from './MessageService';
import { MessageDto } from '../dto/message.dto';
import { Logger } from '../utils/Logger';
// Import specific loaders if needed for ingestDocument
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as path from 'path';

export class ChatbotService {
  private llm: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: SupabaseVectorStore | null = null;
  private messageService: MessageService;
  private logger: WinstonLogger; // Explicitly typed
  private supabaseClient: any;

  constructor() {
    this.logger = Logger.getInstance();
    this.logger.info(
      'Initializing ChatbotService for text generation with hints and memory.',
    );

    // Ensure environment variables are loaded and available
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      this.logger.error(
        'Missing required environment variables for ChatbotService (OpenAI or Supabase keys/URL).',
      );
      throw new Error(
        'Missing required environment variables for ChatbotService',
      );
    }

    // Initialize OpenAI LLM and Embeddings
    try {
      this.llm = new ChatOpenAI({
        openAIApiKey: openAIApiKey,
        modelName: 'gpt-4o',
        temperature: 0.5,
      });
      this.embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
      this.logger.info('OpenAI LLM and Embeddings initialized.');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI components:', error);
      throw error;
    }

    // Initialize Message Service
    this.messageService = new MessageService();

    // Initialize Supabase Client and Vector Store
    try {
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });
      this.vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: this.supabaseClient,
        tableName: 'documents',
        queryName: 'match_documents',
      });
      this.logger.info('Supabase Vector Store initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase Vector Store:', error);
      this.vectorStore = null;
    }
    this.logger.info('ChatbotService initialized.');
  }

  private formatChatHistory(messages: MessageDto[]): string {
    return messages.map((msg) => `${msg.sender}: ${msg.content}`).join('\n');
  }

  async generateResponse(
    userMessageContent: string,
    chatSessionId: number,
    tenantId: number,
  ): Promise<{ type: string; content: string }> {
    this.logger.info(
      `Generating response WITH MEMORY for session ${chatSessionId}, tenant ${tenantId}`,
    );

    if (!this.vectorStore) {
      this.logger.error('Vector store is not available. Cannot perform RAG.');
      return {
        type: 'text',
        content:
          "I'm sorry, but I'm currently unable to access the information needed to answer your question. Please try again later.",
      };
    }

    try {
      const retriever = this.vectorStore.asRetriever({
        searchType: 'similarity',
        k: 4, // Adjust as needed
        filter: (rpc) => rpc.eq('metadata->>tenant_id', tenantId.toString()),
      });

      // --- Prompt for Contextualizer ---
      const contextualizeQSystemPrompt = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.`;
      const contextualizeQPrompt = PromptTemplate.fromTemplate(
        `${contextualizeQSystemPrompt}\n\nChat History:\n{chat_history}\n\nFollow Up Input: {question}\nStandalone question:`,
      );

      // --- Chain to create the standalone question ---
      const contextualizeQChain = RunnableSequence.from([
        {
          question: (input: { question: string; chat_history: string }) =>
            input.question,
          chat_history: (input: { question: string; chat_history: string }) =>
            input.chat_history,
        },
        contextualizeQPrompt,
        this.llm,
        new StringOutputParser(),
      ]);

      // --- Prompt for Final Answer (QA) - Includes History ---
      const qaSystemPrompt = `Bạn là InsightIQ, một trợ lý AI thân thiện và am hiểu về cửa hàng thương mại điện tử này. Mục tiêu của bạn là giúp đỡ khách hàng bằng cách trả lời các câu hỏi của họ một cách chính xác, CHỈ dựa trên thông tin được cung cấp trong ngữ cảnh (context) dưới đây. Sử dụng lịch sử trò chuyện (chat history) để có thêm ngữ cảnh hội thoại nếu cần. Bạn PHẢI trả lời bằng tiếng Việt.

Đầu tiên, xác định loại phản hồi phù hợp nhất dựa trên câu hỏi của người dùng và ngữ cảnh: [TEXT], [INFO], [COMPARE], hoặc [PROMO]. Hãy chọn loại cụ thể nhất phù hợp với yêu cầu chính của người dùng.

Định nghĩa các loại phản hồi:
* [TEXT]: Dùng cho các cuộc trò chuyện chung, lời chào, lời tạm biệt, câu hỏi làm rõ, hoặc khi câu trả lời không phải là thông tin chi tiết về sản phẩm/khuyến mãi cụ thể nhưng vẫn dựa trên ngữ cảnh (ví dụ: "Bạn bán những loại sản phẩm nào?"). Cũng dùng loại này khi bạn cần đặt câu hỏi làm rõ vì không tìm thấy thông tin.
* [INFO]: Dùng khi người dùng yêu cầu thông tin chi tiết về MỘT sản phẩm, chính sách, hoặc chủ đề cụ thể có trong ngữ cảnh. Tập trung trích xuất các thuộc tính chính bằng cách sử dụng các nhãn CÓ TRONG NGỮ CẢNH (ví dụ: **Mã sản phẩm:**, **Giá:**).
* [COMPARE]: Dùng khi người dùng yêu cầu so sánh HAI HOẶC NHIỀU MẶT HÀNG/chủ đề có trong ngữ cảnh một cách rõ ràng.
* [PROMO]: Dùng khi người dùng hỏi cụ thể về giảm giá, bán hàng, hoặc ưu đãi đặc biệt được đề cập trong ngữ cảnh.

Sau đó, bắt đầu phản hồi của bạn *NGAY LẬP TỨC* với gợi ý loại đã chọn (ví dụ: [INFO]), theo sau là một khoảng trắng, và sau đó là câu trả lời hữu ích, mang tính hội thoại bằng tiếng Việt, dựa *hoàn toàn* vào ngữ cảnh.

Nguyên tắc cho văn bản trả lời sau gợi ý loại:
1.  **Chỉ sử dụng thông tin trong ngữ cảnh:** Toàn bộ câu trả lời PHẢI dựa trên thông tin có trong ngữ cảnh và lịch sử trò chuyện. TUYỆT ĐỐI KHÔNG bịa đặt thông tin.
2.  **Khi không tìm thấy thông tin:** Nếu ngữ cảnh không chứa câu trả lời, hãy lịch sự nói rằng bạn không thể tìm thấy thông tin chi tiết đó *trong các tài liệu được cung cấp* và **đặt một câu hỏi làm rõ** để giúp người dùng hoặc thu hẹp yêu cầu của họ. Ví dụ: "Xin lỗi, tôi không tìm thấy thông tin về X trong các tài liệu hiện có. Bạn có thể vui lòng cung cấp thêm chi tiết hoặc hỏi về một sản phẩm khác không?" Bắt đầu phản hồi này bằng [TEXT].
3.  **Xử lý thông tin mâu thuẫn:** Nếu ngữ cảnh chứa thông tin mâu thuẫn, hãy lịch sự chỉ ra điều này và trình bày các phần thông tin khác nhau tìm thấy. Đừng cố gắng giải quyết mâu thuẫn.
4.  **Giọng điệu và Định dạng:**
    * Trả lời bằng tiếng Việt.
    * Sử dụng giọng điệu thân thiện, trò chuyện và rõ ràng.
    * Sử dụng Markdown (ví dụ: **in đậm**) để nhấn mạnh khi thích hợp (ví dụ: cho nhãn hoặc tên sản phẩm).
    * Đối với [INFO], [COMPARE], [PROMO]: Cố gắng sử dụng các nhãn được đề cập *trong chính ngữ cảnh đó* (ví dụ: **Mã sản phẩm:**, **Giá:**, **Thông số kỹ thuật:**, **Khuyến mãi:**) để cấu trúc câu trả lời. Sử dụng dấu đầu dòng cho danh sách (ví dụ: thông số kỹ thuật).
    * Đối với [COMPARE]: Tách biệt rõ ràng thông tin cho từng sản phẩm được so sánh.
    * Đối với [PROMO]: Nêu chi tiết khuyến mãi được tìm thấy trong ngữ cảnh. Nếu ngữ cảnh có ngày hiệu lực, hãy nêu rõ.
5.  **Yếu tố Hội thoại:**
    * Sau gợi ý loại, hãy bắt đầu câu trả lời bằng tiếng Việt.
    * Nếu phù hợp (thường là ở lượt đầu tiên của cuộc trò chuyện, dựa trên lịch sử trò chuyện), hãy thêm một lời chào ngắn gọn bằng tiếng Việt (ví dụ: "Chào bạn!").
    * Sử dụng lịch sử trò chuyện để hiểu ngữ cảnh và đề cập lại các mục trước đó một cách tự nhiên nếu có liên quan (ví dụ: "Về chiếc **áo sơ mi xanh** bạn đã hỏi trước đó...").
    * Kết thúc hầu hết các câu trả lời (nơi hợp lý) bằng một câu hỏi đóng hữu ích như: "**Bạn cần InsightIQ hỗ trợ gì thêm không?**"

Ngữ cảnh (Context):
{context}

Lịch sử trò chuyện (Chat History):
{chat_history}

Câu hỏi (Đã xử lý - Standalone Question):
{question}

Câu trả lời (Bắt đầu bằng MỘT gợi ý loại [TEXT], [INFO], [COMPARE], hoặc [PROMO]):`;

      const qaPrompt = PromptTemplate.fromTemplate(qaSystemPrompt);

      // --- Fetch Chat History ---
      const historyMessages =
        await this.messageService.getByChatSessionId(chatSessionId);
      const recentHistory = historyMessages.slice(-10); // Limit history length
      const formattedHistory = this.formatChatHistory(recentHistory);

      const retrieveAndLogDocs = async (
        question: string,
      ): Promise<Document[]> => {
        this.logger.info(
          `Retrieving documents for standalone question: "${question}"`,
        );
        const retrievedDocs = await retriever.getRelevantDocuments(question);
        this.logger.info(`Retrieved ${retrievedDocs.length} documents.`);
        retrievedDocs.forEach((doc, index) => {
          this.logger.debug(
            `Retrieved Doc ${index + 1} Metadata: ${JSON.stringify(doc.metadata)}`,
          );
          this.logger.debug(
            `Retrieved Doc ${index + 1} Content Snippet: ${doc.pageContent.substring(0, 100)}...`,
          );
        });
        return retrievedDocs;
      };

      // --- Define the Full RAG Chain WITH History ---
      const ragChainWithHistory = RunnableSequence.from([
        RunnablePassthrough.assign({
          chat_history: () => formattedHistory,
        }),
        RunnablePassthrough.assign({
          standalone_question: (input: {
            question: string;
            chat_history: string;
          }) =>
            contextualizeQChain.invoke({
              question: input.question,
              chat_history: input.chat_history,
            }),
        }),
        RunnablePassthrough.assign({
          context: (input: { standalone_question: string }) =>
            retrieveAndLogDocs(input.standalone_question).then(
              formatDocumentsAsString,
            ),
        }),
        {
          context: (input) => input.context,
          question: (input) => input.standalone_question,
          chat_history: (input) => input.chat_history,
        },
        qaPrompt,
        this.llm,
        new StringOutputParser(),
      ]);

      // --- Invoke the Chain ---
      this.logger.info(
        `Invoking RAG chain WITH HISTORY for session ${chatSessionId} with question: "${userMessageContent}"`,
      );
      const startTime = Date.now();

      const llmOutput: string = await ragChainWithHistory.invoke({
        question: userMessageContent,
      });

      const endTime = Date.now();
      this.logger.info(
        `RAG chain WITH HISTORY invocation complete for session ${chatSessionId}. Duration: ${endTime - startTime}ms`,
      );
      this.logger.debug(
        `Raw LLM Output for session ${chatSessionId}: ${llmOutput}`,
      );

      // --- Parse the Hint Prefix ---
      let responseType = 'text';
      let responseContent = llmOutput.trim();
      const hints = {
        '[INFO]': 'productInfo',
        '[COMPARE]': 'productComparison',
        '[PROMO]': 'productPromotion',
        '[TEXT]': 'text',
      };
      for (const prefix in hints) {
        if (llmOutput.startsWith(prefix)) {
          responseType = hints[prefix as keyof typeof hints];
          responseContent = llmOutput.substring(prefix.length).trimStart();
          break;
        }
      }
      this.logger.info(`Parsed response type: ${responseType}`);

      return { type: responseType, content: responseContent };
    } catch (error: any) {
      this.logger.error(
        `Error during Text+Hint LangChain response generation for session ${chatSessionId}:`,
        error,
      );
      return {
        type: 'text',
        content:
          "I'm sorry, but I encountered an error while processing your request. Please try again later.",
      };
    }
  }

  // --- Document Ingestion Method Implementation ---
  async ingestDocument(
    filePath: string,
    tenantId: number,
    originalFilename: string,
    otherMetadata: Record<string, any> = {},
  ): Promise<void> {
    this.logger.info(
      `Starting ingestion for tenant ${tenantId}, file: ${originalFilename} (Path: ${filePath})`,
    );
    if (!this.vectorStore) {
      this.logger.error('Vector store not available. Cannot ingest document.');
      throw new Error('Vector store is not initialized.');
    }
    if (!filePath) {
      this.logger.error('File path is required for ingestion.');
      throw new Error('File path is required for ingestion.');
    }

    let docs: Document[];
    const fileExtension = path.extname(filePath).toLowerCase();

    try {
      // 1. Load Document
      this.logger.info(`Loading document with extension: ${fileExtension}`);
      if (fileExtension === '.pdf') {
        const loader = new PDFLoader(filePath);
        docs = await loader.load();
        this.logger.info(`Loaded ${docs.length} pages/documents from PDF.`);
      } else if (fileExtension === '.txt') {
        const loader = new TextLoader(filePath);
        docs = await loader.load();
        this.logger.info(`Loaded document from TXT file.`);
      } else {
        this.logger.warn(
          `Unsupported file type for ingestion: ${fileExtension}. Skipping file.`,
        );
        return;
      }

      if (!docs || docs.length === 0) {
        this.logger.warn(
          `No content loaded from file: ${originalFilename}. Skipping.`,
        );
        return;
      }

      // 2. Split Document(s) into Chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunks = await textSplitter.splitDocuments(docs);
      this.logger.info(`Split document into ${chunks.length} chunks.`);

      if (chunks.length === 0) {
        this.logger.warn(
          `Document splitting resulted in 0 chunks for file: ${originalFilename}. Skipping.`,
        );
        return;
      }

      // 3. Add Metadata
      const chunksWithMetadata = chunks.map((chunk) => {
        chunk.metadata = {
          ...chunk.metadata,
          ...otherMetadata,
          tenant_id: tenantId.toString(),
          source_document: originalFilename,
        };
        return chunk;
      });

      // 4. Add chunks to Vector Store
      this.logger.info(
        `Adding ${chunksWithMetadata.length} chunks to vector store for tenant ${tenantId}...`,
      );
      const startTime = Date.now();
      await this.vectorStore.addDocuments(chunksWithMetadata);
      const endTime = Date.now();
      this.logger.info(
        `Successfully added documents for tenant ${tenantId} from ${originalFilename}. Duration: ${endTime - startTime}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to ingest document for tenant ${tenantId} (File: ${originalFilename}):`,
        error,
      );
      throw new Error(
        `Document ingestion failed for ${originalFilename}. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
