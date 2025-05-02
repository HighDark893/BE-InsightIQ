// src/services/document/DeleteDocumentService.ts

import { DocumentRepository } from '../../repository/document.repository';
import { supabase } from '../../config/supabase.config';
import * as dotenv from 'dotenv';
import { ChatbotService } from '../ChatbotService'; // <-- Import ChatbotService

dotenv.config(); // Load .env

export class DeleteDocumentService {
  private readonly documentRepository = new DocumentRepository();
  private readonly chatbotService: ChatbotService; // <-- Add ChatbotService instance variable
  private readonly supabaseBucketName =
    process.env.SUPABASE_BUCKET_NAME || 'documents';

  constructor() {
    // Instantiate ChatbotService - Consider using dependency injection if your framework supports it
    try {
      this.chatbotService = new ChatbotService();
      console.log('[DeleteService] ChatbotService instantiated successfully.');
    } catch (error) {
      console.error(
        '[DeleteService] Failed to instantiate ChatbotService:',
        error,
      );
      // If ChatbotService is essential for deletion, throw error to prevent service start/use
      throw new Error(
        'DeleteDocumentService could not initialize ChatbotService.',
      );
    }
  }

  /**
   * Deletes a document file, its embeddings, and its database record.
   * Throws an error if any critical step fails (file delete, embedding delete, DB delete),
   * ensuring consistency.
   * @param id The ID of the document record in the database.
   * @returns boolean: true if all steps were completed successfully.
   * @throws Error if the document is not found or any deletion step fails.
   */
  public async deleteDocumentAndFile(id: number): Promise<boolean> {
    console.log(
      `[DeleteService] Initiating deletion for document ID: ${id} (File, Embeddings, DB Record)`,
    );

    // 1. Find Document in Database
    const documentEntity = await this.documentRepository.findById(id);
    if (!documentEntity) {
      console.warn(
        `[DeleteService] Document with ID ${id} not found in database.`,
      );
      return false; // Or throw new Error(`Document with ID ${id} not found.`)
    }
    console.log(
      `[DeleteService] Found document record: ${documentEntity.fileName}, URL: ${documentEntity.fileUrl}`,
    );

    // --- Start Transaction-like Sequence (if one fails, stop) ---

    // 2. Attempt to delete file from Supabase Storage
    const encodedFilePath = this.extractPathFromUrl(documentEntity.fileUrl);
    if (encodedFilePath) {
      let decodedFilePath: string = ''; // Initialize outside try
      try {
        decodedFilePath = decodeURIComponent(encodedFilePath);
        console.log(
          `[DeleteService] Decoded path for Supabase file deletion: ${decodedFilePath}`,
        );
        const { error: deleteError } = await supabase.storage
          .from(this.supabaseBucketName)
          .remove([decodedFilePath]);

        if (deleteError) {
          console.error(
            `[DeleteService] Failed to delete file '${decodedFilePath}' from Supabase bucket '${this.supabaseBucketName}': ${deleteError.message}`,
          );
          throw new Error(
            `Failed to delete file from Supabase storage: ${deleteError.message}`,
          );
        }
        console.log(
          `[DeleteService] Successfully deleted file '${decodedFilePath}' from Supabase storage.`,
        );
      } catch (e: any) {
        console.error(
          `[DeleteService] Error during Supabase file deletion for path '${decodedFilePath || encodedFilePath}':`,
          e,
        );
        throw e; // Re-throw to stop the process
      }
    } else {
      console.warn(
        `[DeleteService] No valid Supabase path extracted from URL: ${documentEntity.fileUrl}. Skipping file deletion.`,
      );
    }

    // --- 3. Attempt to Delete Embeddings from Vector Store ---
    try {
      console.log(
        `[DeleteService] Attempting to delete embeddings via ChatbotService for document ID: ${id}`,
      );
      await this.chatbotService.deleteEmbeddingsForDocument(id); // Call the new method
      console.log(
        `[DeleteService] Successfully requested embedding deletion for document ID: ${id}`,
      );
    } catch (embeddingError) {
      console.error(
        `[DeleteService] Error deleting embeddings for document ID ${id}:`,
        embeddingError,
      );
      // Throw error to stop the process if embeddings can't be deleted
      // This prevents deleting the DB record if embeddings remain.
      throw new Error(
        `Failed to delete associated embeddings: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown vector store error'}`,
      );
    }

    // 4. Delete record from Database (Only runs if prior steps succeeded)
    try {
      await this.documentRepository.remove(documentEntity);
      console.log(
        `[DeleteService] Successfully deleted document record with ID: ${id} from database.`,
      );
      console.log(`[DeleteService] Deletion complete for document ID: ${id}`);
      return true; // Indicate overall success
    } catch (dbError) {
      console.error(
        `[DeleteService] Error deleting document record with ID ${id} from database (after successful file/embedding deletion):`,
        dbError,
      );
      // This indicates an inconsistency state, but the error should be propagated.
      throw dbError;
    }
  }

  // ... extractPathFromUrl method remains the same ...
  private extractPathFromUrl(fileUrl: string): string | null {
    // ... (existing implementation) ...
    if (!fileUrl) return null;
    if (fileUrl.startsWith('supabase_path:')) {
      return fileUrl.replace('supabase_path:', '');
    }
    try {
      const url = new URL(fileUrl);
      const pathSegments = url.pathname.split(`/${this.supabaseBucketName}/`);
      if (pathSegments.length > 1) {
        return pathSegments[1];
      } else {
        console.warn(
          `[DeleteService ExtractPath] Could not find bucket name '${this.supabaseBucketName}' in pathname: ${url.pathname}`,
        );
        return null;
      }
    } catch (e) {
      console.error(
        '[DeleteService ExtractPath] Could not parse URL:',
        fileUrl,
        e,
      );
      return null;
    }
  }
}
