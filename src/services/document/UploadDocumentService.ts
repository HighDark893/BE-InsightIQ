// src/services/document/UploadDocumentService.ts
//NHỚ CÀI npm install pdf-parse !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
import { DocumentDto } from '../../dto/document.dto';
import { DocumentEntity } from '../../entity/document.entity'; // Ensure your entity has size and supabasePath
import { DocumentRepository } from '../../repository/document.repository';
import { supabase } from '../../config/supabase.config'; // Import Supabase client
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises'; // Use promises API for async file operations
import * as os from 'os'; // To get temporary directory

// --- Import necessary services/utils ---
import { ChatbotService } from '../ChatbotService'; // Adjust path if needed
import { Logger } from '../../utils/Logger'; // Adjust path if needed
import { Logger as WinstonLogger } from 'winston'; // Import Winston Logger type for clarity

dotenv.config();

// Type definition for Multer file (already present in your file)
declare global {
  // ... (Multer File type definition) ...
}

export class UploadDocumentService {
  private readonly documentRepository = new DocumentRepository();
  private readonly supabaseBucketName =
    process.env.SUPABASE_BUCKET_NAME || 'documents';
  // --- Instantiate ChatbotService and Logger ---
  private readonly chatbotService: ChatbotService;
  private readonly logger: WinstonLogger; // Use the imported Winston type

  constructor() {
    this.logger = Logger.getInstance(); // Assuming Logger.getInstance() returns a WinstonLogger instance
    try {
      this.chatbotService = new ChatbotService();
      this.logger.info(
        '[UploadService] ChatbotService initialized successfully.',
      ); // Correct: Use .info()
    } catch (error) {
      // --- Corrected Error Logging ---
      this.logger.error(
        '[UploadService] Failed to initialize ChatbotService:',
        { error },
      ); // Correct: Use .error() and pass error object
      throw new Error(
        'Failed to initialize dependent ChatbotService in UploadDocumentService.',
      );
    }
    this.logger.info('[UploadService] Initialized.'); // Correct: Use .info()
  }

  // Function to map entity to DTO
  private mapDocumentEntityToDto(entity: DocumentEntity): DocumentDto {
    // ... (mapping logic - assuming it's correct) ...
    const dto = new DocumentDto();
    dto.id = entity.id;
    dto.fileName = entity.fileName;
    dto.fileUrl = entity.fileUrl;
    dto.tenantId = entity.tenantId;
    dto.createdAt = entity.createdAt
      ? entity.createdAt.toISOString()
      : new Date().toISOString();
    // dto.size = entity.size;
    return dto;
  }

  public async uploadAndSave(
    file: Express.Multer.File,
    tenantId: number,
  ): Promise<DocumentDto> {
    // --- Corrected Info Logging ---
    this.logger.info(
      `[UploadService] Starting upload & ingest process for tenant ${tenantId}, file: ${file.originalname}, size: ${file.size}`,
    );

    if (!file || !file.buffer) {
      // --- Corrected Error Logging ---
      this.logger.error('[UploadService] No file or file buffer provided.');
      throw new Error('No file buffer provided for upload.');
    }

    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.\-_]/g,
      '_',
    );
    const uniqueFileNameForPath = `${Date.now()}-${sanitizedOriginalName}`;
    const supabasePath = uniqueFileNameForPath; // Your original path pattern

    let publicUrl = '';
    let savedDocumentEntity: DocumentEntity | null = null;
    let tempFilePath: string | null = null;

    try {
      // --- 1. Upload to Supabase Storage ---
      this.logger.info(
        `[UploadService] Uploading to Supabase path: '${supabasePath}'`,
      ); // .info()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.supabaseBucketName)
        .upload(supabasePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        // --- Corrected Error Logging ---
        this.logger.error('[UploadService] Supabase storage upload error:', {
          uploadError,
        }); // .error()
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }
      if (!uploadData || !uploadData.path) {
        // --- Corrected Error Logging ---
        this.logger.error(
          '[UploadService] Supabase upload returned no path data.',
        ); // .error()
        throw new Error('Supabase upload failed: No path data returned.');
      }
      const actualSupabasePath = uploadData.path;
      this.logger.info(
        `[UploadService] File uploaded successfully to Supabase path: ${actualSupabasePath}`,
      ); // .info()

      // --- 2. Get Public URL ---
      const { data: urlData } = supabase.storage
        .from(this.supabaseBucketName)
        .getPublicUrl(actualSupabasePath);

      publicUrl = urlData?.publicUrl || `supabase_path:${actualSupabasePath}`;
      this.logger.info(`[UploadService] Public URL/Path Marker: ${publicUrl}`); // .info()

      // --- 3. Save Document Entity to Database ---
      const documentEntity = new DocumentEntity();
      documentEntity.fileName = file.originalname;
      documentEntity.fileUrl = publicUrl;
      documentEntity.tenantId = tenantId;
      // documentEntity.size = file.size;
      // documentEntity.supabasePath = actualSupabasePath;

      this.logger.info(
        `[UploadService] Saving document metadata to database...`,
      ); // .info()
      savedDocumentEntity = await this.documentRepository.save(documentEntity);
      this.logger.info(
        `[UploadService] Document metadata saved with ID: ${savedDocumentEntity.id}`,
      ); // .info()

      // --- 4. Trigger Embedding Process ---
      try {
        this.logger.info(
          `[UploadService] Preparing temporary file for embedding (DB ID: ${savedDocumentEntity.id})...`,
        ); // .info()
        tempFilePath = path.join(
          os.tmpdir(),
          `insightiq_temp_${savedDocumentEntity.id}_${Date.now()}${path.extname(file.originalname)}`,
        );
        await fs.writeFile(tempFilePath, file.buffer);
        this.logger.info(
          `[UploadService] Temporary file written to: ${tempFilePath}`,
        ); // .info()

        this.logger.info(
          `[UploadService] Calling chatbotService.ingestDocument for document ID: ${savedDocumentEntity.id}...`,
        ); // .info()
        await this.chatbotService.ingestDocument(
          tempFilePath,
          tenantId,
          file.originalname,
          {
            database_document_id: savedDocumentEntity.id.toString(),
            supabase_path: actualSupabasePath,
            original_filename: file.originalname,
          },
        );
        this.logger.info(
          `[UploadService] Embedding process completed (or initiated async) for document ID: ${savedDocumentEntity.id}`,
        ); // .info()
      } catch (embeddingError) {
        // --- Corrected Error Logging ---
        this.logger.error(
          `[UploadService] Embedding failed for document ID ${savedDocumentEntity.id} (File: ${file.originalname}):`,
          { embeddingError },
        ); // .error()
        // Decide on error handling policy
      } finally {
        // --- 5. Clean up the temporary file ---
        if (tempFilePath) {
          try {
            await fs.unlink(tempFilePath);
            this.logger.info(
              `[UploadService] Temporary file deleted: ${tempFilePath}`,
            ); // .info()
          } catch (unlinkError) {
            // --- Corrected Error Logging ---
            this.logger.error(
              `[UploadService] Error deleting temporary file ${tempFilePath}:`,
              { unlinkError },
            ); // .error()
          }
        }
      }
      // --- End Embedding Trigger ---

      // --- 6. Map to DTO and return ---
      return this.mapDocumentEntityToDto(savedDocumentEntity);
    } catch (error) {
      // --- Corrected Error Logging ---
      this.logger.error('[UploadService] Overall error in uploadAndSave:', {
        error,
      }); // .error()
      throw error;
    }
  }
}
