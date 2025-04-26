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

// Import necessary local services, DTOs, and utilities
// Adjust paths if needed based on your project structure
import { MessageService } from './MessageService'; // [cite: 7]
import { MessageDto } from '../dto/message.dto'; // [cite: 59]
import { Logger } from '../utils/Logger';
import { Logger as WinstonLogger } from 'winston';
// import { Sender } from "../constants/SenderEnum"; // [cite: 32] - Not directly used here, but relevant context

export class ChatbotService {
  private llm: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: SupabaseVectorStore | null = null;
  private messageService: MessageService;
  // private logger: Logger;
  private logger: WinstonLogger;
  private supabaseClient: any; // Store client for potential other uses

  constructor() {
    this.logger = Logger.getInstance(); // [cite: 30]
    this.logger.info('Initializing ChatbotService...'); //

    // Ensure environment variables are loaded and available
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      this.logger.error(
        'Missing required environment variables for ChatbotService (OpenAI or Supabase keys/URL).',
      ); //
      throw new Error(
        'Missing required environment variables for ChatbotService',
      );
    }

    // Initialize OpenAI LLM and Embeddings
    try {
      this.llm = new ChatOpenAI({
        openAIApiKey: openAIApiKey,
        modelName: 'gpt-3.5-turbo', // Consider making this configurable
        temperature: 0.3, // Adjust for desired creativity/factuality balance
      });
      this.embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
      this.logger.info('OpenAI LLM and Embeddings initialized.'); //
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI components:', error); //
      throw error; // Re-throw to prevent service from starting in a bad state
    }

    // Initialize Message Service
    this.messageService = new MessageService(); // [cite: 7]

    // Initialize Supabase Client and Vector Store
    try {
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          // Optional: configure auth persistence if needed, but service key bypasses RLS
          persistSession: false,
        },
      });

      this.vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: this.supabaseClient,
        tableName: 'documents', // Default table name for LangChain Supabase integration
        queryName: 'match_documents', // Default query function name
        // IMPORTANT: Ensure your 'match_documents' function in Supabase is set up
        // correctly, especially if using metadata filtering.
      });
      this.logger.info('Supabase Vector Store initialized successfully.'); //
    } catch (error) {
      this.logger.error('Failed to initialize Supabase Vector Store:', error); //
      // Decide how to handle this - maybe allow limited functionality?
      // For now, we let the service initialize but log the error.
      // generateResponse method will need to handle this.vectorStore being null.
      this.vectorStore = null;
    }
    this.logger.info('ChatbotService initialized.'); //
  }

  // Helper to format chat history messages
  private formatChatHistory(messages: MessageDto[]): string {
    // [cite: 59]
    return messages.map((msg) => `${msg.sender}: ${msg.content}`).join('\n'); // [cite: 59]
  }

  // Main method to generate chatbot response
  async generateResponse(
    userMessageContent: string,
    chatSessionId: number,
    tenantId: number,
  ): Promise<string> {
    this.logger.info(
      `Generating response for session ${chatSessionId}, tenant ${tenantId}`,
    ); //

    if (!this.vectorStore) {
      this.logger.error('Vector store is not available. Cannot perform RAG.'); //
      return "I'm sorry, but I'm currently unable to access the information needed to answer your question. Please try again later.";
    }

    try {
      // 1. Set up the Retriever with Tenant ID filtering
      // This ensures we only get documents relevant to the specific tenant
      const retriever = this.vectorStore.asRetriever({
        searchType: 'similarity', // Or "mmr"
        k: 4, // Number of relevant documents to retrieve (tune as needed)
        filter: (rpc) => rpc.eq('metadata->>tenant_id', tenantId.toString()), // Filter metadata->tenant_id == tenantId
        // Note: Supabase metadata filtering syntax might vary slightly.
        // Ensure your 'documents' table has a 'metadata' JSONB column
        // and 'tenant_id' exists within it. Also ensure you have a pgvector index
        // that supports filtering: https://supabase.com/docs/guides/ai/vector-embeddings#indexed-metadata-filtering
      });

      // 2. Define Prompt Templates

      // Prompt to reformulate the question based on history (Contextualizer)
      const contextualizeQSystemPrompt = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.`;
      const contextualizeQPrompt = PromptTemplate.fromTemplate(
        `${contextualizeQSystemPrompt}\n\nChat History:\n{chat_history}\n\nFollow Up Input: {question}\nStandalone question:`,
      );

      // Prompt for the main RAG chain to answer the question using context
      // Tailor this prompt based on InsightIQ requirements (product inquiry, comparison etc.)
      const qaSystemPrompt = `You are InsightIQ, a helpful AI assistant for an e-commerce business.
Answer the user's question based *ONLY* on the context provided below.
If the context doesn't contain the answer, say you don't have that information in the available documents.
Do not make up information. Be concise and focus on answering the specific question asked.
If the user asks for a comparison, use the context provided for each product to highlight differences.
If the user asks about promotions or pricing, provide the information *only if* it is explicitly mentioned in the context. State if the information might be outdated if the context seems old.

Context:
{context}

Question: {question}

Helpful Answer:`;
      const qaPrompt = PromptTemplate.fromTemplate(qaSystemPrompt);

      // 3. Fetch Chat History
      const historyMessages =
        await this.messageService.getByChatSessionId(chatSessionId); // [cite: 7]
      const formattedHistory = this.formatChatHistory(historyMessages);

      // 4. Define the LangChain Runnable Chains (LCEL)

      // Chain to create the standalone question
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

      // Chain for the main RAG process
      const ragChain = RunnableSequence.from([
        // Pass through necessary values and retrieve context
        RunnablePassthrough.assign({
          // First, create standalone question using history
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
          // Then, retrieve context based on the standalone question
          context: (input: {
            question: string;
            chat_history: string;
            standalone_question: string;
          }) =>
            retriever
              .pipe(formatDocumentsAsString)
              .invoke(input.standalone_question),
        }),
        // Finally, generate the answer using the retrieved context and standalone question
        {
          context: (input) => input.context,
          question: (input) => input.standalone_question, // Use standalone question for the final answer prompt
        },
        qaPrompt,
        this.llm,
        new StringOutputParser(),
      ]);

      // 5. Invoke the RAG chain
      this.logger.info(
        `Invoking RAG chain for session ${chatSessionId} with question: "${userMessageContent}"`,
      ); //
      const startTime = Date.now();

      const result = await ragChain.invoke({
        question: userMessageContent,
        chat_history: formattedHistory,
      });

      const endTime = Date.now();
      this.logger.info(
        `RAG chain invocation complete for session ${chatSessionId}. Duration: ${endTime - startTime}ms`,
      ); //
      this.logger.debug(
        `Generated response for session ${chatSessionId}: ${result}`,
      ); // Use debug for potentially long responses

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error during LangChain response generation for session ${chatSessionId}:`,
        error,
      ); //
      if (error.message && error.message.includes('Authentication failed')) {
        return "I'm sorry, but there seems to be an issue connecting to the AI service. Please check the server configuration.";
      }
      if (error.message && error.message.includes('access control')) {
        this.logger.error(
          `Potential Supabase RLS or Policy issue when filtering by tenantId: ${tenantId}`,
        );
        return "I'm sorry, I encountered an issue accessing the relevant information for your request.";
      }
      return "I'm sorry, but I encountered an unexpected error while processing your request. Please try again later.";
    }
  }

  // --- TODO: Document Ingestion Method ---
  // This method would handle loading, splitting, embedding, and storing documents
  // It's a separate process, often triggered by an API endpoint or background job.
  async ingestDocument(
    filePathOrContent: string,
    tenantId: number,
    metadata: Record<string, any> = {},
  ) {
    this.logger.info(`Attempting ingestion for tenant ${tenantId}`); //
    if (!this.vectorStore) {
      this.logger.error('Vector store not available. Cannot ingest document.'); //
      return;
    }
    // 1. Load Document (Use LangChain document loaders: TextLoader, PDFLoader, etc.)
    //    const loader = new TextLoader(filePathOrContent); // Example
    //    const docs = await loader.load();

    // 2. Split Document into Chunks (RecursiveCharacterTextSplitter is common)
    //    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    //    const chunks = await textSplitter.splitDocuments(docs);

    // 3. Add Tenant ID and other metadata to each chunk
    const documentsWithMetadata: Document[] = []; // Replace with actual chunks
    /*
         chunks.forEach(chunk => {
            chunk.metadata = {
                ...chunk.metadata, // Keep original metadata if any
                ...metadata,       // Add custom metadata passed in
                tenant_id: tenantId.toString() // CRUCIAL: Add tenant_id as string
            };
            documentsWithMetadata.push(chunk);
         });
         */

    // 4. Add chunks to Supabase Vector Store
    try {
      // Ensure documentsWithMetadata is populated correctly above
      if (documentsWithMetadata.length > 0) {
        this.logger.info(
          `Adding ${documentsWithMetadata.length} chunks to vector store for tenant ${tenantId}...`,
        );
        await this.vectorStore.addDocuments(documentsWithMetadata);
        this.logger.info(
          `Successfully added documents for tenant ${tenantId}.`,
        );
      } else {
        this.logger.warn(
          `No document chunks to add for tenant ${tenantId}. Check loading/splitting.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to ingest documents for tenant ${tenantId}:`,
        error,
      );
    }
  }
}
