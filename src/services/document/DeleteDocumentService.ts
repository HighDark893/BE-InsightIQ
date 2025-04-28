// src/services/document/DeleteDocumentService.ts

import { DocumentRepository } from '../../repository/document.repository';
import { supabase } from '../../config/supabase.config'; // Import Supabase client
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env

export class DeleteDocumentService {
    private readonly documentRepository = new DocumentRepository();
    private readonly supabaseBucketName = process.env.SUPABASE_BUCKET_NAME || 'documents'; // Đảm bảo tên bucket đúng

    /**
     * Xóa document khỏi Supabase và Database.
     * @param id ID của document cần xóa trong Database.
     * @returns boolean: true nếu xóa thành công (ít nhất là xóa khỏi DB), false nếu không tìm thấy document.
     * @throws Error nếu có lỗi trong quá trình xóa file Supabase hoặc xóa DB.
     */
    public async deleteDocumentAndFile(id: number): Promise<boolean> {
        console.log(`[DeleteService] Attempting to delete document with ID: ${id}`);

        // 1. Tìm Document trong Database để lấy fileUrl
        const documentEntity = await this.documentRepository.findById(id);
        if (!documentEntity) {
            console.warn(`[DeleteService] Document with ID ${id} not found in database.`);
            return false; // Không tìm thấy document
        }

        console.log(`[DeleteService] Found document: ${documentEntity.fileName}, URL: ${documentEntity.fileUrl}`);

        // 2. Xóa file khỏi Supabase Storage (nếu có fileUrl hợp lệ)
        let supabaseDeleteSuccess = true; // Mặc định là true nếu không cần xóa hoặc xóa thành công
        const filePath = this.extractPathFromUrl(documentEntity.fileUrl);

        if (filePath) {
            console.log(`[DeleteService] Extracted Supabase path: ${filePath}. Attempting deletion...`);
            try {
                const { error: deleteError } = await supabase.storage
                    .from(this.supabaseBucketName)
                    .remove([filePath]); // Truyền vào một mảng các path

                if (deleteError) {
                    // Ghi log lỗi nhưng không chặn việc xóa DB (tùy vào yêu cầu nghiệp vụ)
                    // Nếu muốn dừng lại khi không xóa được file, hãy throw error ở đây
                    console.error(`[DeleteService] Failed to delete file ${filePath} from Supabase: ${deleteError.message}`);
                    supabaseDeleteSuccess = false;
                    // throw new Error(`Failed to delete file from Supabase: ${deleteError.message}`); // Bỏ comment nếu muốn dừng lại
                } else {
                    console.log(`[DeleteService] Successfully deleted file ${filePath} from Supabase.`);
                }
            } catch (e) {
                console.error("[DeleteService] Error during Supabase file deletion:", e);
                supabaseDeleteSuccess = false;
                // throw e; // Bỏ comment nếu muốn dừng lại
            }
        } else {
            console.warn(`[DeleteService] Could not extract Supabase path from URL: ${documentEntity.fileUrl}. Skipping Supabase deletion.`);
            // Có thể fileUrl không phải từ Supabase hoặc đã bị lỗi trước đó
        }

        // 3. Xóa record khỏi Database
        try {
            await this.documentRepository.remove(documentEntity);
            console.log(`[DeleteService] Successfully deleted document record with ID: ${id} from database.`);
            // Trả về true ngay cả khi Supabase delete không thành công (nhưng đã log lỗi)
            // Thay đổi logic này nếu bạn muốn chỉ trả về true khi cả hai đều thành công.
            return true;
        } catch (dbError) {
             console.error(`[DeleteService] Error deleting document record with ID ${id} from database:`, dbError);
             throw dbError; // Ném lỗi để controller xử lý
        }
    }

    // Hàm helper để trích xuất path từ URL (giống trong UploadDocumentService)
    private extractPathFromUrl(fileUrl: string): string | null {
        if (!fileUrl) return null;
        // Nếu lưu path trực tiếp (phòng trường hợp getPublicUrl lỗi)
        if (fileUrl.startsWith('supabase_path:')) {
            return fileUrl.replace('supabase_path:', '');
        }
        try {
            const url = new URL(fileUrl);
            // Tách path dựa trên tên bucket
            // Ví dụ: /storage/v1/object/public/documents/some-file.pdf
            const pathSegments = url.pathname.split(`/${this.supabaseBucketName}/`);
            if (pathSegments.length > 1) {
                // Lấy phần sau tên bucket
                return pathSegments[1];
            }
        } catch (e) {
            console.error("[DeleteService] Could not parse URL to extract path:", fileUrl, e);
        }
        return null;
    }
}