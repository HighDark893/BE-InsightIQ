// src/services/document/DeleteDocumentService.ts (Modified)
import { DocumentRepository } from '../../repository/document.repository';
import { supabase } from '../../config/supabase.config';
import * as dotenv from 'dotenv';
// --- Import DocumentIngestionService ---
import { DocumentIngestionService } from './DocumentIngestionService'; // Adjust path if needed
import { Logger } from '../../utils/Logger'; // Import Logger
import { Logger as WinstonLogger } from 'winston'; // Import Winston type

dotenv.config();

export class DeleteDocumentService {
  private readonly documentRepository = new DocumentRepository();
  // --- Use DocumentIngestionService ---
  private readonly documentIngestionService: DocumentIngestionService;
  private readonly supabaseBucketName =
    process.env.SUPABASE_BUCKET_NAME || 'documents';
  private readonly logger: WinstonLogger; // Add logger instance variable

  constructor() {
    this.logger = Logger.getInstance(); // Initialize logger
    try {
      // --- Instantiate DocumentIngestionService ---
      this.documentIngestionService = new DocumentIngestionService();
      this.logger.info(
        '[DeleteService] DocumentIngestionService initialized successfully.',
      );
    } catch (error) {
      this.logger.error(
        '[DeleteService] Failed to initialize DocumentIngestionService:',
        { error },
      );
      throw new Error(
        'DeleteDocumentService could not initialize DocumentIngestionService.',
      );
    }
  }

  /**
   * Deletes a document file, its embeddings, and its database record.
   * Throws an error if any critical step fails.
   */
  public async deleteDocumentAndFile(id: number): Promise<boolean> {
    this.logger.info(
      `[DeleteService] Initiating deletion for document ID: ${id} (File, Embeddings, DB Record)`,
    );

    // 1. Find Document in Database
    const documentEntity = await this.documentRepository.findById(id);
    if (!documentEntity) {
      this.logger.warn(
        `[DeleteService] Document with ID ${id} not found in database.`,
      );
      // Return false or throw, depending on desired behavior for not found
      return false;
      // throw new Error(`Document with ID ${id} not found.`);
    }
    this.logger.info(
      `[DeleteService] Found document record: ${documentEntity.fileName}, URL/Marker: ${documentEntity.fileUrl}`,
    );

    // --- Transaction-like Sequence ---

    // 2. Attempt to delete file from Supabase Storage
    // Use a reliable method to get the Supabase path (e.g., from metadata or URL parsing)
    const supabasePath = this.extractSupabasePath(documentEntity.fileUrl); // Use your extraction logic

    if (supabasePath) {
      try {
        this.logger.info(
          `[DeleteService] Attempting to delete file from Supabase path: ${supabasePath}`,
        );
        const { error: deleteError } = await supabase.storage
          .from(this.supabaseBucketName)
          .remove([supabasePath]); // Pass path in an array

        if (deleteError) {
          // Log error but consider policy: Should failure block deletion?
          // If file is gone but embeddings/DB entry remain, it's an orphaned record.
          this.logger.error(
            `[DeleteService] Failed to delete file '${supabasePath}' from Supabase bucket '${this.supabaseBucketName}': ${deleteError.message}. Continuing with embedding/DB deletion attempt.`,
            { details: deleteError }, // Log full error details
          );
          // Decide whether to throw or continue. Continuing risks orphans.
          // throw new Error(`Failed to delete file from Supabase storage: ${deleteError.message}`);
        } else {
          this.logger.info(
            `[DeleteService] Successfully deleted file '${supabasePath}' from Supabase storage (or file did not exist).`,
          );
        }
      } catch (e: any) {
        // Catch any unexpected errors during Supabase interaction
        this.logger.error(
          `[DeleteService] Error during Supabase file deletion for path '${supabasePath}':`,
          e,
        );
        // Again, decide policy: throw or continue?
        // throw e; // Re-throw to stop the process if file deletion is critical
      }
    } else {
      this.logger.warn(
        `[DeleteService] No valid Supabase path could be determined from URL/marker: ${documentEntity.fileUrl}. Skipping Supabase file deletion.`,
      );
    }

    // 3. Attempt to Delete Embeddings via DocumentIngestionService
    try {
      this.logger.info(
        `[DeleteService] Attempting to delete embeddings via DocumentIngestionService for document ID: ${id}`,
      );
      // --- Call the new service ---
      await this.documentIngestionService.deleteEmbeddingsForDocument(id);
      this.logger.info(
        `[DeleteService] Successfully requested embedding deletion for document ID: ${id}`,
      );
    } catch (embeddingError) {
      this.logger.error(
        `[DeleteService] Error deleting embeddings for document ID ${id}:`,
        embeddingError,
      );
      // CRITICAL: Throw error to stop the process if embeddings can't be deleted.
      // This prevents deleting the DB record if embeddings remain.
      throw new Error(
        `Failed to delete associated embeddings: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown vector store error'}`,
      );
    }

    // 4. Delete record from Database (Only if prior steps didn't throw)
    try {
      await this.documentRepository.remove(documentEntity);
      this.logger.info(
        `[DeleteService] Successfully deleted document record with ID: ${id} from database.`,
      );
      this.logger.info(
        `[DeleteService] Deletion complete for document ID: ${id}`,
      );
      return true; // Indicate overall success
    } catch (dbError) {
      this.logger.error(
        `[DeleteService] CRITICAL Error deleting document record with ID ${id} from database (AFTER successful file/embedding deletion steps):`,
        dbError,
      );
      // This indicates an inconsistency state (file/embeddings might be gone, but DB record remains).
      // Propagate the error. Manual cleanup might be required.
      throw dbError;
    }
  }

  // --- Helper to extract Supabase path ---
  // Adjust this based on how you store the path (e.g., in metadata, parsing URL)
  private extractSupabasePath(fileUrlOrMarker: string): string | null {
    if (!fileUrlOrMarker) return null;

    // Option 1: If you store a specific marker like "supabase_path:..."
    if (fileUrlOrMarker.startsWith('supabase_path:')) {
      return fileUrlOrMarker.replace('supabase_path:', '');
    }

    // Option 2: If you store the full public URL
    try {
      const url = new URL(fileUrlOrMarker);
      // Example: https://<project_ref>.supabase.co/storage/v1/object/public/<bucket_name>/<path_to_file>
      const pathSegments = url.pathname.split(
        `/storage/v1/object/public/${this.supabaseBucketName}/`,
      );
      if (pathSegments.length > 1) {
        // Decode URI components in case of special characters in filename
        return decodeURIComponent(pathSegments[1]);
      } else {
        this.logger.warn(
          `[DeleteService ExtractPath] Could not extract path using bucket name '${this.supabaseBucketName}' from pathname: ${url.pathname}`,
        );
        return null;
      }
    } catch (e) {
      // If it's not a valid URL and not the marker, log and return null
      this.logger.warn(
        `[DeleteService ExtractPath] Input is not a valid URL or the expected marker format: ${fileUrlOrMarker}`,
      );
      return null;
    }
  }
}
