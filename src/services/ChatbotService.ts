// src/services/ChatbotService.ts
// npm install @langchain/openai @langchain/community @supabase/supabase-js winston langchain
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

    // --- Get Current Date in UTC YYYY-MM-DD format ---
    const currentUtcDate = new Date();
    const currentUtcDateString = currentUtcDate.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
    this.logger.info(
      `[ChatbotService] Current UTC date for filtering: ${currentUtcDateString}`,
    );

    try {
      // --- Define Retriever with Time Filter ---
      const retriever = this.vectorStore.asRetriever({
        searchType: 'similarity',
        k: 5, // Retrieve a few more initially to allow for filtering? Adjust as needed.
        filter: (
          rpc, // Assuming rpc is the Supabase client instance from langchain
        ) =>
          rpc
            .eq('metadata->>tenant_id', tenantId.toString()) // Filter by tenant
            .not('metadata->>valid_from', 'is', null) // Ensure valid_from exists
            .lte('metadata->>valid_from', currentUtcDateString) // valid_from <= current_date
            .not('metadata->>valid_until', 'is', null) // Ensure valid_until exists
            .gte('metadata->>valid_until', currentUtcDateString), // valid_until >= current_date
        // Note: This assumes Supabase/pgvector can efficiently compare 'YYYY-MM-DD' strings.
        // If performance is an issue, storing dates as numbers (e.g., YYYYMMDD) or using actual date types
        // in a dedicated column (if SupabaseVectorStore supports filtering on it) might be needed.
        // This basic string comparison should work functionally.
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
      const qaSystemPrompt = `Bạn là InsightIQ, một trợ lý AI thân thiện... Mục tiêu của bạn là giúp đỡ khách hàng bằng cách trả lời các câu hỏi của họ một cách chính xác, CHỈ dựa trên thông tin được cung cấp trong ngữ cảnh (context) dưới đây, vốn đã được lọc để chỉ chứa thông tin phù hợp với ngày hôm nay.

      Hôm nay là ngày: {currentUtcDateString} (UTC).
      
      Sử dụng lịch sử trò chuyện (chat history) để có thêm ngữ cảnh hội thoại nếu cần. Bạn PHẢI trả lời bằng tiếng Việt.
      
      Xác định loại phản hồi: [TEXT], [INFO], [COMPARE], [PROMO].
      
      Định nghĩa các loại:
      * [TEXT]: Trò chuyện chung, làm rõ, không tìm thấy thông tin.
      * [INFO]: Chi tiết về MỘT sản phẩm/chủ đề.
      * [COMPARE]: So sánh HAI HOẶC NHIỀU mục.
      * [PROMO]: Thông tin về giảm giá/ưu đãi.
      
      Bắt đầu phản hồi NGAY LẬP TỨC với gợi ý loại (ví dụ: [INFO]), sau đó là câu trả lời bằng tiếng Việt.
      
      Nguyên tắc cho văn bản trả lời:
      1.  **Chỉ dùng ngữ cảnh:** KHÔNG bịa đặt thông tin. Toàn bộ câu trả lời PHẢI dựa trên ngữ cảnh và lịch sử trò chuyện.
      2.  **Không tìm thấy thông tin:** Nếu ngữ cảnh (đã lọc) không chứa câu trả lời, hãy nói rõ là không tìm thấy thông tin *cho ngày hôm nay* trong tài liệu được cung cấp và đặt câu hỏi làm rõ. Bắt đầu bằng [TEXT].
      3.  **Đề cập tính hợp lệ:** Khi đề cập đến thông tin nhạy cảm về thời gian (ví dụ: khuyến mãi, sự kiện) được tìm thấy trong ngữ cảnh, hãy nêu rõ ngày hiệu lực của nó nếu có (ví dụ: "Chương trình khuyến mãi này có hiệu lực từ [ngày bắt đầu] đến [ngày kết thúc]."). Hãy nhớ rằng ngữ cảnh chỉ chứa thông tin hợp lệ cho ngày hôm nay ({currentUtcDateString}).      
      4.  **Giọng điệu và Định dạng:** Thân thiện, trò chuyện, rõ ràng, tiếng Việt. Sử dụng Markdown (ví dụ: **in đậm**) để nhấn mạnh khi thích hợp (ví dụ: cho nhãn hoặc tên sản phẩm).
          Đối với [INFO], [COMPARE], [PROMO]: Cố gắng sử dụng các nhãn được đề cập *trong chính ngữ cảnh đó* (ví dụ: **Mã sản phẩm:**, **Giá:**, **Thông số kỹ thuật:**, **Khuyến mãi:**) để cấu trúc câu trả lời. Sử dụng dấu đầu dòng cho danh sách (ví dụ: thông số kỹ thuật). 
          Đối với [COMPARE]: Tách biệt rõ ràng thông tin cho từng sản phẩm được so sánh. 
          Đối với [PROMO]: Nêu chi tiết khuyến mãi được tìm thấy trong ngữ cảnh. Nếu ngữ cảnh có ngày hiệu lực, hãy nêu rõ. Sử dụng nhãn từ ngữ cảnh nếu có.
      5.  **Yếu tố Hội thoại:** Chào hỏi khi thích hợp. Tham chiếu lịch sử trò chuyện. Kết thúc bằng câu hỏi mở nếu hợp lý ("Bạn cần hỗ trợ gì thêm không?").
      
      Ngữ cảnh (Context - đã lọc theo ngày {currentUtcDateString}):
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
          currentUtcDateString: () => currentUtcDateString,
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
}
