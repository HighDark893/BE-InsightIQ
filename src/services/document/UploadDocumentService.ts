// src/services/document/UploadDocumentService.ts (Modified)
//NHỚ CÀI npm install pdf-parse !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
import { DocumentDto } from '../../dto/document.dto';
import { DocumentEntity } from '../../entity/document.entity';
import { DocumentRepository } from '../../repository/document.repository';
import { supabase } from '../../config/supabase.config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { DocumentIngestionService } from './DocumentIngestionService';
import { Logger } from '../../utils/Logger';
import { Logger as WinstonLogger } from 'winston';

dotenv.config();

// Multer file type definition
// ... (assume it's defined or imported correctly) ...

export class UploadDocumentService {
  private readonly documentRepository = new DocumentRepository();
  private readonly supabaseBucketName =
    process.env.SUPABASE_BUCKET_NAME || 'documents';
  private readonly documentIngestionService: DocumentIngestionService;
  private readonly logger: WinstonLogger;

  constructor() {
    this.logger = Logger.getInstance();
    try {
      this.documentIngestionService = new DocumentIngestionService();
      this.logger.info(
        '[UploadService] DocumentIngestionService initialized successfully.',
      );
    } catch (error) {
      this.logger.error(
        '[UploadService] Failed to initialize DocumentIngestionService:',
        { error },
      );
      throw new Error(
        'Failed to initialize dependent DocumentIngestionService in UploadDocumentService.',
      );
    }
    this.logger.info('[UploadService] Initialized.');
  }

  // --- Method signature updated ---
  public async uploadAndSave(
    file: Express.Multer.File,
    tenantId: number,
    validFrom: string, // Added
    validUntil: string, // Added
  ): Promise<DocumentDto> {
    this.logger.info(
      `[UploadService] Starting upload & ingest process for tenant ${tenantId}, file: ${file.originalname}, validFrom: ${validFrom}, validUntil: ${validUntil}`,
    );

    // ... (file validation, path generation remain the same) ...
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.\-_]/g,
      '_',
    );
    const uniqueFileNameForPath = `${Date.now()}-${sanitizedOriginalName}`;
    const supabasePath = `tenant_${uniqueFileNameForPath}`; // Example path structure

    let publicUrl = '';
    let savedDocumentEntity: DocumentEntity | null = null;
    let tempFilePath: string | null = null;
    let actualSupabasePath = ''; // Define higher for potential rollback

    try {
      // --- 1. Upload to Supabase ---
      this.logger.info(
        `[UploadService] Uploading to Supabase path: '${supabasePath}'`,
      );
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.supabaseBucketName)
        .upload(supabasePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError)
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      if (!uploadData?.path)
        throw new Error('Supabase upload failed: No path data returned.');

      actualSupabasePath = uploadData.path; // Store the actual path
      this.logger.info(
        `[UploadService] File uploaded to Supabase path: ${actualSupabasePath}`,
      );

      // --- 2. Get Public URL/Marker ---
      const { data: urlData } = supabase.storage
        .from(this.supabaseBucketName)
        .getPublicUrl(actualSupabasePath);
      publicUrl = urlData?.publicUrl || `supabase_path:${actualSupabasePath}`;
      this.logger.info(`[UploadService] Public URL/Path Marker: ${publicUrl}`);

      // --- 3. Save Document Metadata to DB ---
      const documentEntity = new DocumentEntity();
      documentEntity.fileName = file.originalname;
      documentEntity.fileUrl = publicUrl;
      documentEntity.tenantId = tenantId;
      // Note: We don't store valid_from/valid_until in the main DocumentEntity table here.
      // They will live in the vector store metadata per chunk.
      this.logger.info(
        `[UploadService] Saving document metadata to database...`,
      );
      savedDocumentEntity = await this.documentRepository.save(documentEntity);
      this.logger.info(
        `[UploadService] Document metadata saved with ID: ${savedDocumentEntity.id}`,
      );

      // --- 4. Trigger Embedding Process ---
      try {
        this.logger.info(
          `[UploadService] Preparing temp file for embedding (DB ID: ${savedDocumentEntity.id})...`,
        );
        tempFilePath = path.join(
          os.tmpdir(),
          `insightiq_temp_${savedDocumentEntity.id}_${Date.now()}${path.extname(file.originalname)}`,
        );
        await fs.writeFile(tempFilePath, file.buffer);
        this.logger.info(`[UploadService] Temp file written: ${tempFilePath}`);

        this.logger.info(
          `[UploadService] Calling documentIngestionService.ingestDocument for doc ID: ${savedDocumentEntity.id}...`,
        );

        // --- Pass date info to ingestion service ---
        await this.documentIngestionService.ingestDocument(
          tempFilePath,
          tenantId,
          file.originalname,
          {
            // Metadata for vector store chunks
            database_document_id: savedDocumentEntity.id.toString(),
            supabase_path: actualSupabasePath,
            original_filename: file.originalname,
            valid_from: validFrom, // Pass the date string
            valid_until: validUntil, // Pass the date string
          },
        );
        this.logger.info(
          `[UploadService] Embedding completed/initiated for doc ID: ${savedDocumentEntity.id}`,
        );
      } catch (embeddingError) {
        this.logger.error(
          `[UploadService] Embedding failed for doc ID ${savedDocumentEntity.id}:`,
          { embeddingError },
        );
        // Decide handling policy (re-throw, log only, rollback?) - Re-throwing for now
        throw embeddingError;
      } finally {
        // --- 5. Clean up temporary file ---
        if (tempFilePath) {
          try {
            await fs.unlink(tempFilePath);
            this.logger.info(
              `[UploadService] Temp file deleted: ${tempFilePath}`,
            );
          } catch (unlinkError) {
            this.logger.error(
              `[UploadService] Error deleting temp file ${tempFilePath}:`,
              { unlinkError },
            );
          }
        }
      }

      // --- 6. Map to DTO and return ---
      return this.mapDocumentEntityToDto(savedDocumentEntity); // Reuse your existing mapping function
    } catch (error: any) {
      // Catch errors from any step
      this.logger.error('[UploadService] Overall error in uploadAndSave:', {
        error: error.message,
        stack: error.stack,
      });

      // --- Optional Rollback for Supabase File ---
      if (
        actualSupabasePath &&
        !(error instanceof Error && error.message.includes('Embedding failed'))
      ) {
        // Attempt to delete the Supabase file if upload succeeded but a later step failed
        // (Avoid deleting if the specific error was the embedding failure, as rollback might be complex)
        try {
          this.logger.warn(
            `[UploadService] Rolling back Supabase upload due to error: deleting ${actualSupabasePath}`,
          );
          await supabase.storage
            .from(this.supabaseBucketName)
            .remove([actualSupabasePath]);
        } catch (rollbackError) {
          this.logger.error(
            `[UploadService] Failed to rollback Supabase file deletion for ${actualSupabasePath}:`,
            { rollbackError },
          );
        }
      }
      // --- Optional Rollback for DB Entry ---
      // If DB entry was created but embedding failed, you might delete the DB entry here too.

      throw error; // Re-throw the error for the controller
    }
  }

  // mapDocumentEntityToDto method remains the same
  private mapDocumentEntityToDto(entity: DocumentEntity): DocumentDto {
    const dto = new DocumentDto();
    dto.id = entity.id;
    dto.fileName = entity.fileName;
    dto.fileUrl = entity.fileUrl;
    dto.tenantId = entity.tenantId;
    dto.createdAt = entity.createdAt
      ? entity.createdAt.toISOString()
      : new Date().toISOString();
    return dto;
  }
}
