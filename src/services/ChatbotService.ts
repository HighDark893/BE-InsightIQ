// src/services/ChatbotService.ts
// --- IMPORTS ---
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StringOutputParser } from '@langchain/core/output_parsers';
// REMOVED: JsonOutputFunctionsParser import is no longer needed here
// import { JsonOutputFunctionsParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableMap,
} from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import type { Document } from '@langchain/core/documents';
import { AIMessage } from '@langchain/core/messages'; // Import AIMessage
import { Logger as WinstonLogger } from 'winston';
import { z } from 'zod'; // Import Zod for schema definition
import { zodToJsonSchema } from 'zod-to-json-schema'; // Helper to convert Zod schema to JSON schema

// Local imports
import { MessageService } from './MessageService';
import { MessageDto } from '../dto/message.dto';
import { Logger } from '../utils/Logger';
// Import the new DTOs/Interfaces (adjust paths if needed)
import { ProductDataDto, ProductSpecification } from '../dto/ProductData.dto';
import {
  ProductComparisonDataDto,
  ComparisonProduct,
  ProductPolicies,
} from '../dto/ProductComparisonData.dto';
// import { ProductPromotionDataDto } from '../dto/ProductComparisonData.dto'; // Corrected import path
import { ProductPromotionDataDto } from '../dto/ProductPromotionData.dto';
// --- ZOD Schemas for Structured Output ---
// (Keep the existing Zod schemas: productSpecificationSchema, productDataSchema, etc.)
// --- ZOD Schemas (Keep existing definitions) ---
const productSpecificationSchema = z
  .object({
    label: z
      .string()
      .describe(
        "The label or name of the specification (e.g., 'Screen Size', 'RAM').",
      ),
    value: z
      .string()
      .describe("The value of the specification (e.g., '15 inches', '16GB')."),
  })
  .describe('A single specification of a product.');

const productDataSchema = z
  .object({
    intro: z
      .string()
      .optional()
      .describe(
        'Optional introductory sentence from the bot before presenting product details.',
      ),
    name: z.string().describe('The name of the product.'),
    sku: z
      .string()
      .optional()
      .describe('Stock Keeping Unit (SKU) of the product, if available.'),
    category: z.string().optional().describe('The product category.'),
    manufacturer: z
      .string()
      .optional()
      .describe('The manufacturer of the product.'),
    shortDescription: z
      .string()
      .optional()
      .describe('A brief description of the product.'),
    specifications: z
      .array(productSpecificationSchema)
      .optional()
      .describe('List of product specifications.'),
    price: z
      .number()
      .optional()
      .describe(
        'The numeric price of the product, if available and applicable.',
      ),
    priceString: z
      .string()
      .optional()
      .describe(
        "The formatted price string (e.g., '1.200.000₫', 'Liên hệ'). Use this if a numeric price isn't available or suitable.",
      ),
    promotion: z
      .string()
      .optional()
      .describe('Description of any current promotion related to the product.'),
    stockStatus: z
      .string()
      .optional()
      .describe("Stock status (e.g., 'Còn hàng', 'Hết hàng', 'Sắp về')."),
    warranty: z
      .string()
      .optional()
      .describe("Warranty information (e.g., '12 tháng')."),
    imageUrl: z
      .string()
      .optional()
      .describe('URL for the product image, if available.'),
    comment: z
      .string()
      .optional()
      .describe('Optional concluding sentence or comment from the bot.'),
  })
  .describe('Structured information about a single product.');

const productPoliciesSchema = z
  .object({
    return: z.string().optional().describe('Return policy details.'),
    shipping: z.string().optional().describe('Shipping policy details.'),
    payment: z.string().optional().describe('Payment policy details.'),
  })
  .describe('Policies related to a product.');

const comparisonProductSchema = productDataSchema
  .extend({
    policies: productPoliciesSchema
      .optional()
      .describe('Policies specific to this product in the comparison.'),
  })
  .describe('Details of a single product within a comparison context.');

const productComparisonSchema = z
  .object({
    intro: z
      .string()
      .optional()
      .describe(
        'Optional introductory sentence from the bot before presenting the comparison.',
      ),
    products: z
      .array(comparisonProductSchema)
      .min(2)
      .describe(
        'An array containing details of at least two products being compared.',
      ),
    conclusion: z
      .string()
      .optional()
      .describe(
        'Optional concluding sentence or summary from the bot after the comparison.',
      ),
  })
  .describe('Structured comparison between two or more products.');

const productPromotionSchema = z
  .object({
    // --- Fields matching Frontend Component ---
    productName: z
      .string()
      .describe('Tên của sản phẩm chính được áp dụng khuyến mãi này.'), // REQUIRED for context in FE
    promotionDescription: z
      .string()
      .describe('Mô tả chi tiết về chương trình khuyến mãi.'), // Renamed from 'description'
    originalPrice: z
      .number()
      .optional()
      .describe('Giá gốc của sản phẩm (dạng số), nếu có trong ngữ cảnh.'), // Added
    discountedPrice: z
      .number()
      .optional()
      .describe('Giá sau khi đã giảm (dạng số), nếu có trong ngữ cảnh.'), // Added
    discountPercentage: z
      .number()
      .optional()
      .describe(
        'Phần trăm giảm giá (dạng số, ví dụ: 10 cho 10%), nếu có trong ngữ cảnh.',
      ), // Added
    gift: z
      .string()
      .optional()
      .describe('Mô tả quà tặng kèm theo (ví dụ: "Tai nghe XYZ"), nếu có.'), // Added
    validUntil: z
      .string()
      .optional()
      .describe(
        'Ngày/thời gian kết thúc khuyến mãi (định dạng YYYY-MM-DD nếu có, hoặc văn bản mô tả như "đến hết tháng", "khi hết quà").',
      ), // Kept, ensure FE can handle string
    conditions: z
      .string()
      .optional()
      .describe(
        'Các điều kiện áp dụng khuyến mãi (ví dụ: "Áp dụng cho đơn hàng online", "Số lượng có hạn").',
      ), // Added
    productImageUrl: z
      .string()
      .optional()
      .describe('URL hình ảnh của sản phẩm chính được khuyến mãi, nếu có.'), // Added

    // --- Optional fields kept from original (for LLM context/flexibility, but not directly used by FE template) ---
    intro: z.string().optional().describe('Câu giới thiệu tùy chọn của bot.'),
    promotionName: z
      .string()
      .optional()
      .describe('Tên chương trình khuyến mãi (nếu có).'), // Kept optional
    applicableProducts: z
      .string()
      .optional()
      .describe('Mô tả các sản phẩm/danh mục được áp dụng.'), // Kept optional
    validFrom: z.string().optional().describe('Ngày bắt đầu (YYYY-MM-DD).'), // Kept optional
    couponCode: z.string().optional().describe('Mã giảm giá (nếu có).'), // Kept optional
    comment: z
      .string()
      .optional()
      .describe('Câu bình luận/kết luận tùy chọn của bot.'), // Kept optional
  })
  .describe(
    'Structured information about a specific product promotion, matching frontend display needs.',
  );
// --- Response Type Enum ---
enum ResponseType {
  TEXT = 'text',
  INFO = 'productInfo',
  COMPARE = 'productComparison',
  PROMO = 'productPromotion',
}

// --- ChatbotService Class ---
export class ChatbotService {
  // (Keep existing properties: llm, embeddings, vectorStore, etc.)
  private llm: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: SupabaseVectorStore | null = null;
  private messageService: MessageService;
  private logger: WinstonLogger;
  private supabaseClient: SupabaseClient; // Use SupabaseClient type

  constructor() {
    // (Keep existing constructor logic)
    this.logger = Logger.getInstance();
    this.logger.info(
      'Initializing ChatbotService with structured output capabilities.',
    );

    const openAIApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      this.logger.error(
        'Missing required environment variables (OpenAI or Supabase).',
      );
      throw new Error(
        'Missing required environment variables for ChatbotService',
      );
    }

    try {
      // Initialize LLM with function/tool calling support
      this.llm = new ChatOpenAI({
        openAIApiKey: openAIApiKey,
        modelName: 'gpt-4o', // Or another model supporting function calling well
        temperature: 0.3, // Lower temperature for more factual, structured output
      });
      this.embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
      this.logger.info(
        'OpenAI LLM (for function calling) and Embeddings initialized.',
      );
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI components:', error);
      throw error;
    }

    this.messageService = new MessageService();

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
      this.vectorStore = null; // Keep null if initialization fails
    }
    this.logger.info('ChatbotService initialized.');
  }

  // (Keep formatChatHistory method)
  private formatChatHistory(messages: MessageDto[]): string {
    return messages.map((msg) => `${msg.sender}: ${msg.content}`).join('\n');
  }

  // --- Main Response Generation Method (UPDATED) ---
  async generateResponse(
    userMessageContent: string,
    chatSessionId: number,
    tenantId: number,
  ): Promise<{
    type: ResponseType;
    content:
      | string
      | ProductDataDto
      | ProductComparisonDataDto
      | ProductPromotionDataDto;
  }> {
    this.logger.info(
      `Generating response for session ${chatSessionId}, tenant ${tenantId}`,
    );

    if (!this.vectorStore) {
      this.logger.error('Vector store is not available. Cannot perform RAG.');
      return {
        type: ResponseType.TEXT,
        content:
          'Xin lỗi, tôi không thể truy cập thông tin cần thiết ngay lúc này. Vui lòng thử lại sau.',
      };
    }

    const currentUtcDate = new Date();
    const currentUtcDateString = currentUtcDate.toISOString().split('T')[0];
    this.logger.info(`Current UTC date for filtering: ${currentUtcDateString}`);

    try {
      // --- Retriever (remains the same) ---
      const retriever = this.vectorStore.asRetriever({
        searchType: 'similarity',
        k: 5,
        filter: (rpc) =>
          rpc
            .eq('metadata->>tenant_id', tenantId.toString())
            .not('metadata->>valid_from', 'is', null)
            .lte('metadata->>valid_from', currentUtcDateString)
            .not('metadata->>valid_until', 'is', null)
            .gte('metadata->>valid_until', currentUtcDateString),
      });

      // --- Contextualizer Chain (remains the same) ---
      const contextualizeQSystemPrompt = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.`;
      const contextualizeQPrompt = PromptTemplate.fromTemplate(
        `${contextualizeQSystemPrompt}\n\nChat History:\n{chat_history}\n\nFollow Up Input: {question}\nStandalone question:`,
      );
      const contextualizeQChain = RunnableSequence.from([
        {
          question: (input: { question: string; chat_history: string }) =>
            input.question,
          chat_history: (input: { question: string; chat_history: string }) =>
            input.chat_history,
        },
        contextualizeQPrompt,
        this.llm, // Use the main LLM instance
        new StringOutputParser(),
      ]);

      // --- Define Functions/Tools for Structured Output (remains the same) ---
      const functions = [
        {
          name: 'output_product_info',
          description: 'Output structured information about a single product.',
          parameters: zodToJsonSchema(productDataSchema),
        },
        {
          name: 'output_product_comparison',
          description:
            'Output a structured comparison between two or more products.',
          parameters: zodToJsonSchema(productComparisonSchema),
        },
        {
          name: 'output_product_promotion',
          description:
            'Output structured information about a specific promotion or discount.',
          parameters: zodToJsonSchema(productPromotionSchema),
        },
      ];

      // --- Main QA Prompt (remains the same) ---
      const qaSystemPrompt = `Bạn là InsightIQ, một trợ lý AI thân thiện... Mục tiêu của bạn là giúp đỡ khách hàng bằng cách trả lời các câu hỏi của họ một cách chính xác, CHỈ dựa trên thông tin được cung cấp trong ngữ cảnh (context) dưới đây, vốn đã được lọc để chỉ chứa thông tin phù hợp với ngày hôm nay ({currentUtcDateString} UTC).

      Sử dụng lịch sử trò chuyện (chat history) để có thêm ngữ cảnh hội thoại nếu cần. Bạn PHẢI trả lời bằng tiếng Việt.

      **QUAN TRỌNG:** Dựa trên câu hỏi của người dùng và ngữ cảnh được cung cấp, hãy xác định loại phản hồi phù hợp:
      1.  **Thông tin sản phẩm (INFO):** Nếu người dùng hỏi chi tiết về MỘT sản phẩm cụ thể. Nếu vậy, HÃY SỬ DỤNG function 'output_product_info' để trả về dữ liệu có cấu trúc.
      2.  **So sánh sản phẩm (COMPARE):** Nếu người dùng yêu cầu so sánh HAI HOẶC NHIỀU sản phẩm. Nếu vậy, HÃY SỬ DỤNG function 'output_product_comparison' để trả về dữ liệu có cấu trúc.
      3.  **Thông tin khuyến mãi (PROMO):** Nếu người dùng hỏi về một chương trình giảm giá, ưu đãi cụ thể. Nếu vậy, HÃY SỬ DỤNG function 'output_product_promotion' để trả về dữ liệu có cấu trúc.
      4.  **Văn bản thông thường (TEXT):** Cho tất cả các trường hợp khác (trò chuyện chung, làm rõ, chào hỏi, không tìm thấy thông tin). KHÔNG sử dụng function nào, chỉ cần trả lời bằng văn bản tiếng Việt thông thường.

      **Nguyên tắc trả lời:**
      * **Chỉ dùng ngữ cảnh:** KHÔNG bịa đặt thông tin. Toàn bộ câu trả lời PHẢI dựa trên ngữ cảnh và lịch sử trò chuyện.
      * **Không tìm thấy thông tin:** Nếu ngữ cảnh (đã lọc) không chứa câu trả lời, hãy nói rõ là không tìm thấy thông tin *cho ngày hôm nay* trong tài liệu được cung cấp và đặt câu hỏi làm rõ. Trả lời bằng văn bản thông thường (TEXT).
      * **Đề cập tính hợp lệ:** Khi đề cập đến thông tin nhạy cảm về thời gian (ví dụ: khuyến mãi) được tìm thấy trong ngữ cảnh, hãy nêu rõ ngày hiệu lực của nó nếu có.
      * **Giọng điệu:** Thân thiện, trò chuyện, rõ ràng, tiếng Việt.
      * **Đối với structured output (INFO, COMPARE, PROMO):** Điền đầy đủ các trường trong schema của function tương ứng dựa trên ngữ cảnh. Nếu thông tin không có, hãy bỏ qua trường đó (để là undefined hoặc null trong JSON). Cố gắng bao gồm cả 'intro' và 'comment' nếu phù hợp để làm cho phản hồi tự nhiên hơn.
      * **Riêng với PROMO:** Cố gắng điền các trường sau cho 'output_product_promotion; nếu tìm thấy trong ngữ cảnh:
                * 'productName': Tên sản phẩm chính đang được khuyến mãi.
                * 'promotionDescription': Mô tả chi tiết khuyến mãi là gì.
                * 'originalPrice': Giá gốc (số).
                * 'discountedPrice': Giá sau giảm (số).
                * 'discountPercentage': % giảm (số).
                * 'gift': Quà tặng kèm (chuỗi).
                * 'validUntil': Thời hạn (chuỗi, ví dụ '31/12/2025' hoặc 'đến hết tháng').
                * 'conditions': Điều kiện áp dụng (chuỗi).
                * 'productImageUrl': Link ảnh sản phẩm (chuỗi).
            * Cố gắng bao gồm cả 'intro' và 'comment' nếu phù hợp để làm cho phản hồi tự nhiên hơn.


      Ngữ cảnh (Context - đã lọc theo ngày {currentUtcDateString}):
      {context}

      Lịch sử trò chuyện (Chat History):
      {chat_history}

      Câu hỏi (Đã xử lý - Standalone Question):
      {question}

      Câu trả lời (Sử dụng function phù hợp nếu là INFO, COMPARE, PROMO; nếu không, trả lời bằng văn bản TEXT thông thường):`;
      const qaPrompt = PromptTemplate.fromTemplate(qaSystemPrompt);

      // --- Bind Functions/Tools to the LLM ---
      const llmWithTools = this.llm.bind({
        functions: functions,
      });

      // --- Fetch Chat History (remains the same) ---
      const historyMessages =
        await this.messageService.getByChatSessionId(chatSessionId);
      const recentHistory = historyMessages.slice(-10);
      const formattedHistory = this.formatChatHistory(recentHistory);

      // Helper to retrieve and log documents (remains the same)
      const retrieveAndLogDocs = async (
        question: string,
      ): Promise<Document[]> => {
        this.logger.info(
          `Retrieving documents for standalone question: "${question}"`,
        );
        const retrievedDocs = await retriever.getRelevantDocuments(question);
        this.logger.info(`Retrieved ${retrievedDocs.length} documents.`);
        return retrievedDocs;
      };

      // --- Define the Full RAG Chain WITHOUT the final parser --- // MODIFIED
      const ragChain = RunnableSequence.from([
        RunnablePassthrough.assign({
          chat_history: () => formattedHistory, // Provide history
        }),
        // 1. Create standalone question
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
        // 2. Retrieve documents based on standalone question
        RunnablePassthrough.assign({
          context: (input: { standalone_question: string }) =>
            retrieveAndLogDocs(input.standalone_question).then(
              formatDocumentsAsString,
            ),
        }),
        // 3. Prepare input for the main QA prompt
        {
          context: (input) => input.context,
          question: (input) => input.standalone_question,
          chat_history: (input) => input.chat_history,
          currentUtcDateString: () => currentUtcDateString,
        },
        // 4. Call the main QA prompt
        qaPrompt,
        // 5. Call the LLM with tools bound
        llmWithTools,
        // 6. REMOVED PARSER: The output will be an AIMessage object
      ]);

      // --- Invoke the Chain ---
      this.logger.info(
        `Invoking RAG chain for session ${chatSessionId} with question: "${userMessageContent}"`,
      );
      const startTime = Date.now();

      // Invoke and expect an AIMessage from the LLM
      const llmOutput: AIMessage = await ragChain.invoke({
        question: userMessageContent,
        chat_history: formattedHistory, // Ensure history is passed here too if needed by earlier steps
      });

      const endTime = Date.now();
      this.logger.info(
        `RAG chain invocation complete for session ${chatSessionId}. Duration: ${endTime - startTime}ms`,
      );
      this.logger.debug(`Raw LLM Output Object: ${JSON.stringify(llmOutput)}`); // Log the raw output

      // --- Process LLM Output ---
      let responseType: ResponseType;
      let responseContent:
        | string
        | ProductDataDto
        | ProductComparisonDataDto
        | ProductPromotionDataDto;

      // --- NEW: Check for function call in additional_kwargs ---
      const functionCall = llmOutput.additional_kwargs?.function_call;

      if (functionCall && functionCall.name && functionCall.arguments) {
        // LLM response contains a function call
        this.logger.info(
          `LLM response contains function call: '${functionCall.name}' for session ${chatSessionId}`,
        );
        this.logger.debug(
          `Function Arguments (raw): ${functionCall.arguments}`,
        );

        try {
          const args = JSON.parse(functionCall.arguments); // Parse arguments

          switch (functionCall.name) {
            case 'output_product_info':
              responseType = ResponseType.INFO;
              // You might want to add validation here using the Zod schema
              responseContent = args as ProductDataDto;
              break;
            case 'output_product_comparison':
              responseType = ResponseType.COMPARE;
              responseContent = args as ProductComparisonDataDto;
              break;
            case 'output_product_promotion':
              responseType = ResponseType.PROMO;
              responseContent = args as ProductPromotionDataDto;
              break;
            default:
              this.logger.warn(
                `LLM called unknown function '${functionCall.name}'. Falling back to TEXT.`,
              );
              responseType = ResponseType.TEXT;
              responseContent = `Tôi đã tìm thấy thông tin nhưng không thể định dạng đúng cho chức năng '${functionCall.name}'. Dữ liệu: ${functionCall.arguments}`;
              break;
          }
        } catch (parseError) {
          this.logger.error(
            `Failed to parse function call arguments for '${functionCall.name}': ${parseError}`,
            { rawArgs: functionCall.arguments },
          );
          responseType = ResponseType.TEXT;
          responseContent = `Xin lỗi, tôi gặp lỗi khi xử lý dữ liệu có cấu trúc từ AI.`;
        }
      } else if (llmOutput.content && typeof llmOutput.content === 'string') {
        // LLM returned a normal text response in the content field
        responseType = ResponseType.TEXT;
        responseContent = llmOutput.content.trim();
        this.logger.info(
          `LLM returned TEXT response for session ${chatSessionId}`,
        );
        this.logger.debug(`Raw TEXT Content: ${responseContent}`);
      } else {
        // Unexpected output format from the LLM
        this.logger.error(
          `Unexpected LLM output format or empty content for session ${chatSessionId}:`,
          JSON.stringify(llmOutput), // Log the full object
        );
        responseType = ResponseType.TEXT;
        responseContent =
          'Xin lỗi, tôi gặp lỗi khi tạo phản hồi (định dạng không mong đợi). Vui lòng thử lại.';
      }
      // --- END NEW PROCESSING LOGIC ---

      return { type: responseType, content: responseContent };
    } catch (error: any) {
      // Keep existing error handling
      this.logger.error(
        `Error during LangChain response generation for session ${chatSessionId}:`,
        error,
      );
      // Log the full error object for more details
      this.logger.error('Error Details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
      return {
        type: ResponseType.TEXT,
        content:
          'Xin lỗi, đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
      };
    }
  }
} // End of ChatbotService class
