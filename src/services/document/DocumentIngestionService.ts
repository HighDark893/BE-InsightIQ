// src/services/document/DocumentIngestionService.ts
//npm install @langchain/openai @langchain/community @langchain/core @supabase/supabase-js winston langchain
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Document } from '@langchain/core/documents';
import { Logger as WinstonLogger } from 'winston';
import { Logger } from '../../utils/Logger';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as path from 'path';

export class DocumentIngestionService {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: SupabaseVectorStore;
  private logger: WinstonLogger;
  private supabaseClient: SupabaseClient;

  constructor() {
    this.logger = Logger.getInstance();
    this.logger.info('Initializing DocumentIngestionService...');

    const openAIApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      this.logger.error(
        'Missing required environment variables for DocumentIngestionService (OpenAI or Supabase keys/URL).',
      );
      throw new Error(
        'Missing required environment variables for DocumentIngestionService',
      );
    }

    try {
      this.embeddings = new OpenAIEmbeddings({ openAIApiKey: openAIApiKey });
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });
      this.vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: this.supabaseClient,
        tableName: 'documents', // Make sure this matches your Supabase table
        queryName: 'match_documents', // Make sure this matches your Supabase function
      });
      this.logger.info(
        'OpenAI Embeddings and Supabase Vector Store initialized for ingestion/deletion.',
      );
    } catch (error) {
      this.logger.error(
        'Failed to initialize OpenAI/Supabase components in DocumentIngestionService:',
        error,
      );
      throw error;
    }

    this.logger.info('DocumentIngestionService initialized.');
  }

  async ingestDocument(
    filePath: string,
    tenantId: number, // Keep tenantId if needed for metadata/filtering during ingestion
    originalFilename: string,
    metadata: Record<string, any> = {}, // Pass necessary metadata
  ): Promise<void> {
    this.logger.info(
      `[IngestionService] Starting ingestion for tenant ${tenantId}, file: ${originalFilename} (Path: ${filePath})`,
    );
    if (!this.vectorStore) {
      // This check might be redundant if constructor throws, but good practice
      this.logger.error(
        '[IngestionService] Vector store not available. Cannot ingest document.',
      );
      throw new Error('Vector store is not initialized.');
    }
    if (!filePath) {
      this.logger.error(
        '[IngestionService] File path is required for ingestion.',
      );
      throw new Error('File path is required for ingestion.');
    }

    // --- Validate required date metadata ---
    if (!metadata.valid_from || !metadata.valid_until) {
      this.logger.error(
        `[IngestionService] Missing valid_from ('${metadata.valid_from}') or valid_until ('${metadata.valid_until}') in metadata for file ${originalFilename}. Skipping ingestion for this file.`,
      );
      // Depending on policy, you might throw an error or just return to skip.
      // Throwing might be better to signal the upload failed due to missing required info.
      throw new Error(
        `Missing required validity dates (valid_from/valid_until) for ${originalFilename}`,
      );
      // return; // Or just skip
    }

    let docs: Document[];
    const fileExtension = path.extname(filePath).toLowerCase();

    try {
      // 1. Load Document
      this.logger.info(
        `[IngestionService] Loading document with extension: ${fileExtension}`,
      );
      if (fileExtension === '.pdf') {
        const loader = new PDFLoader(filePath); // Requires pdf-parse
        docs = await loader.load();
        this.logger.info(
          `[IngestionService] Loaded ${docs.length} pages/documents from PDF.`,
        );
      } else if (fileExtension === '.txt') {
        const loader = new TextLoader(filePath);
        docs = await loader.load();
        this.logger.info(`[IngestionService] Loaded document from TXT file.`);
      } else {
        this.logger.warn(
          `[IngestionService] Unsupported file type: ${fileExtension}. Skipping.`,
        );
        return; // Skip unsupported types
      }

      if (!docs || docs.length === 0) {
        this.logger.warn(
          `[IngestionService] No content loaded from file: ${originalFilename}. Skipping.`,
        );
        return;
      }

      // 2. Split Document(s) into Chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 300,
      });
      const chunks = await textSplitter.splitDocuments(docs);
      this.logger.info(
        `[IngestionService] Split document into ${chunks.length} chunks.`,
      );

      if (chunks.length === 0) {
        this.logger.warn(
          `[IngestionService] Document splitting resulted in 0 chunks for file: ${originalFilename}. Skipping.`,
        );
        return;
      }

      // 3. Add Metadata (ensure tenantId and other necessary fields are included)
      const chunksWithMetadata = chunks.map((chunk) => {
        chunk.metadata = {
          ...chunk.metadata, // Keep original metadata from loader (e.g., page number)
          tenant_id: tenantId.toString(),
          database_document_id:
            metadata.database_document_id?.toString() || 'UNKNOWN', // Ensure it exists
          valid_from: metadata.valid_from, // Add valid_from string
          valid_until: metadata.valid_until, // Add valid_until string
          source_document: originalFilename,
        };
        return chunk;
      });

      // 4. Add chunks to Vector Store
      this.logger.info(
        `[IngestionService] Adding ${chunksWithMetadata.length} chunks to vector store for tenant ${tenantId}...`,
      );
      const startTime = Date.now();
      await this.vectorStore.addDocuments(chunksWithMetadata);
      const endTime = Date.now();
      this.logger.info(
        `[IngestionService] Successfully added documents for tenant ${tenantId} from ${originalFilename}. Duration: ${endTime - startTime}ms`,
      );
    } catch (error) {
      this.logger.error(
        `[IngestionService] Failed to ingest document for tenant ${tenantId} (File: ${originalFilename}):`,
        error,
      );
      throw new Error(
        `Document ingestion failed for ${originalFilename}. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public async deleteEmbeddingsForDocument(
    databaseDocumentId: number,
  ): Promise<void> {
    this.logger.info(
      `[IngestionService] Attempting to delete embeddings for document database ID: ${databaseDocumentId}`,
    );

    if (!this.vectorStore) {
      this.logger.error(
        '[IngestionService] Vector store is not available. Cannot delete embeddings.',
      );
      throw new Error(
        'Vector store is not initialized, cannot delete embeddings.',
      );
    }
    if (!this.supabaseClient) {
      this.logger.error(
        '[IngestionService] Supabase client is not available. Cannot delete embeddings directly.',
      );
      throw new Error('Supabase client is not initialized.');
    }

    // Define the filter based on the metadata key used during ingestion
    const filterKey = 'database_document_id'; // Ensure this matches metadata added during ingest
    const filterValue = databaseDocumentId.toString();

    try {
      // Using direct Supabase client call is often more reliable for metadata filtering
      this.logger.info(
        `[IngestionService] Using direct Supabase client to delete from table 'documents' where metadata->>'${filterKey}' = '${filterValue}'`,
      );
      const { data, error } = await this.supabaseClient
        .from('documents') // Use your vector table name
        .delete()
        .eq(`metadata->>${filterKey}`, filterValue); // Filter on the JSONB metadata field

      if (error) {
        this.logger.error(
          `[IngestionService] Error deleting embeddings using Supabase client: ${error.message}`,
          { details: error },
        );
        throw new Error(
          `Supabase client failed to delete embeddings: ${error.message}`,
        );
      }

      // Supabase delete returns data about the operation, including count if enabled.
      // Log the outcome for confirmation.
      this.logger.info(
        `[IngestionService] Successfully executed delete request for embeddings related to document database ID: ${databaseDocumentId}. Supabase response indicates potential rows matched/deleted.`,
        data,
      );
    } catch (error) {
      // Catch errors from the delete method
      this.logger.error(
        `[IngestionService] Failed to delete embeddings for document database ID ${databaseDocumentId}:`,
        error,
      );
      // Re-throw the error to signal failure
      throw new Error(
        `Failed to delete embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
