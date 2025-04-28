// src/services/document/UploadDocumentService.ts

import { DocumentDto } from '../../dto/document.dto';
import { DocumentEntity } from '../../entity/document.entity';
import { DocumentRepository } from '../../repository/document.repository';
import { supabase } from '../../config/supabase.config'; // Import Supabase client
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env

// Nhớ cài: npm install --save-dev @types/multer
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        stream: NodeJS.ReadableStream;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export class UploadDocumentService {
  // Inject DocumentRepository để lưu vào DB
  private readonly documentRepository = new DocumentRepository();
  private readonly supabaseBucketName = process.env.SUPABASE_BUCKET_NAME || 'documents'; // Hoặc 'pdf-files' nếu bạn dùng tên đó

  /**
   * Upload file lên Supabase và lưu record vào DB.
   */
  public async uploadAndSave(
    file: Express.Multer.File,
    tenantId: number // Vẫn nhận tenantId để lưu vào DB
  ): Promise<DocumentDto> {
    console.log(`[UploadService] Starting upload for file: ${file.originalname}, tenant: ${tenantId}`);

    try {
      // --- Upload lên Supabase ---
      // ✅ Sửa dòng này: Bỏ ${tenantId}/ để không tạo thư mục con
      const filePath = `${Date.now()}-${file.originalname}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.supabaseBucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('[UploadService] Supabase upload error:', uploadError);
        throw new Error(`Failed to upload file to Supabase: ${uploadError.message}`);
      }
      console.log(`[UploadService] File uploaded successfully to path: ${filePath}`);

      // --- Lấy Public URL ---
      const { data: urlData } = supabase.storage
        .from(this.supabaseBucketName)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        console.warn(`[UploadService] Could not get public URL for ${filePath}. Saving path instead.`);
      }
      const fileUrl = urlData?.publicUrl || `supabase_path:${filePath}`;

      // --- Tạo và lưu Document Entity vào Database ---
      const documentEntity = new DocumentEntity();
      documentEntity.fileName = file.originalname;
      documentEntity.fileUrl = fileUrl;
      documentEntity.tenantId = tenantId; // Lưu tenantId vào DB

      // Dùng repository để lưu
      const savedDocumentEntity = await this.documentRepository.save(documentEntity);
      console.log(`[UploadService] Document record saved with ID: ${savedDocumentEntity.id}`);

      // --- Map sang DTO và trả về ---
      return this.mapDocumentEntityToDto(savedDocumentEntity); // Gọi hàm map

    } catch (error) {
      console.error('[UploadService] Error in uploadAndSave:', error);
      throw error;
    }
  }

  // Hàm map này có thể copy từ DocumentService hoặc tách ra thành hàm dùng chung (utility)
  private mapDocumentEntityToDto(entity: DocumentEntity): DocumentDto {
    const documentDto = new DocumentDto();
    documentDto.id = entity.id;
    documentDto.fileName = entity.fileName;
    documentDto.fileUrl = entity.fileUrl;
    documentDto.tenantId = entity.tenantId;
    documentDto.createdAt = entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString(); // Thêm kiểm tra null/undefined
    return documentDto;
  }

   // Hàm helper để trích xuất path từ URL (copy từ DocumentService nếu cần dùng ở đây)
   private extractPathFromUrl(fileUrl: string): string | null {
    if (fileUrl.startsWith('supabase_path:')) {
        return fileUrl.replace('supabase_path:', '');
    }
    try {
        const url = new URL(fileUrl);
        const pathSegments = url.pathname.split(`/${this.supabaseBucketName}/`);
        if (pathSegments.length > 1) {
            // ✅ Sửa lại để lấy đúng path khi không có folder tenantId
            // Ví dụ: /storage/v1/object/public/pdf-files/1714288800000-MyFile.pdf
            // pathSegments[1] sẽ là "1714288800000-MyFile.pdf"
            return pathSegments[1];
        }
    } catch (e) {
        console.error("[UploadService] Could not parse URL to extract path:", fileUrl, e);
    }
    return null;
  }

  // Hàm xóa file Supabase (vẫn cần thiết cho service Delete sau này)
  public async deleteSupabaseFile(fileUrl: string): Promise<boolean> {
      const filePath = this.extractPathFromUrl(fileUrl);
      if (!filePath) {
          console.warn("[UploadService] Could not extract file path to delete:", fileUrl);
          return false;
      }
       try {
            const { error: deleteError } = await supabase.storage
                .from(this.supabaseBucketName)
                .remove([filePath]);
            if (deleteError) {
                console.error(`[UploadService] Failed to delete file ${filePath} from Supabase: ${deleteError.message}`);
                return false;
            } else {
                 console.log(`[UploadService] Successfully deleted file ${filePath} from Supabase.`);
                 return true;
            }
       } catch(e) {
            console.error("[UploadService] Error deleting file from Supabase:", e);
            return false;
       }
  }
}
