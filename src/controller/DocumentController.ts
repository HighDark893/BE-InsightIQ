// src/controller/DocumentController.ts

import { Request, Response, Router } from 'express';
import { UploadDocumentService } from '../services/document/UploadDocumentService';
import { DeleteDocumentService } from '../services/document/DeleteDocumentService';
import { DocumentDto } from '../dto/document.dto';
import multer from 'multer';
import { DocumentService } from '../services/document/DocumentService'; // Import DocumentService

const router = Router();
const uploadDocumentService = new UploadDocumentService();
const deleteDocumentService = new DeleteDocumentService();
const documentService = new DocumentService(); // Khởi tạo DocumentService cho GET

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Route POST ---
router.post(
  '/upload',
  upload.single('file'),
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        console.error('[Router] No file found in request (expected field: file)');
        // Sử dụng return để thoát sớm, nhưng hàm vẫn là Promise<void>
        res.status(400).json({ message: 'No file uploaded (field name mismatch?).' });
        return;
      }
      const tenantIdString = req.body.tenantId;
      if (!tenantIdString) {
        console.error('[Router] Tenant ID missing in request body');
        res.status(400).json({ message: 'Tenant ID is required.' });
        return;
      }
      const tenantId = parseInt(tenantIdString, 10);
      if (isNaN(tenantId)) {
        console.error(`[Router] Invalid Tenant ID format: ${tenantIdString}`);
        res.status(400).json({ message: 'Invalid Tenant ID format.' });
        return;
      }
      console.log(`[Router] Received file: ${req.file.originalname}, tenantId: ${tenantId}`);
      const savedDocument: DocumentDto = await uploadDocumentService.uploadAndSave(
          req.file,
          tenantId
      );
      console.log(`[Router] Upload successful, returning document ID: ${savedDocument.id}`);
      // Gửi response, không cần return res
      res.status(201).json(savedDocument);
    } catch (error: any) {
      console.error('[Router] Error processing file upload:', error);
      // Gửi response lỗi, không cần return res
      res.status(500).json({
          message: 'Failed to process file upload.',
          error: error.message || 'Unknown server error'
      });
    }
  }
);

// --- Route GET ---
router.get('/',
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
    try {
      const documents = await documentService.getAll(); // Dùng documentService
      res.status(200).json(documents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching documents';
      console.error('Failed to fetch documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents', error: message });
    }
});

router.get('/:tenantId',
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.params.tenantId) {
        res.status(400).json({ message: 'Tenant ID parameter is required.' });
        return;
      }
      const tenantId = parseInt(req.params.tenantId, 10);
      if (isNaN(tenantId)) {
        res.status(400).json({ message: 'Invalid Tenant ID parameter format.' });
        return;
      }
      const documents = await documentService.getByTenantId(tenantId); // Dùng documentService
      res.status(200).json(documents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching documents by tenant';
      console.error('Failed to fetch documents by tenant:', error);
      res.status(500).json({ message: 'Failed to fetch documents by tenant', error: message });
    }
});


// --- Route DELETE ---
router.delete('/:id',
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.params.id) {
      res.status(400).json({ message: 'Document ID parameter is required.' });
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid Document ID parameter format.' });
      return;
    }

    console.log(`[Router] Received DELETE request for document ID: ${id}`);

    // Gọi service xóa mới
    const success = await deleteDocumentService.deleteDocumentAndFile(id);

    if (!success) {
      // Service trả về false nghĩa là không tìm thấy document trong DB
      console.log(`[Router] Document ID ${id} not found for deletion.`);
      res.status(404).json({ message: 'Document not found.' });
    } else {
      // Xóa thành công (ít nhất là DB record), trả về 204 No Content
      console.log(`[Router] Document ID ${id} deleted successfully.`);
      res.status(204).send(); // Dùng send() cho 204 No Content
    }
  } catch (error: any) {
    // Bắt lỗi từ service
    const message = error instanceof Error ? error.message : 'Unknown error deleting document';
    // Kiểm tra xem id có tồn tại trên req.params không trước khi log
    const errorId = req.params.id || 'UNKNOWN';
    console.error(`[Router] Failed to delete document ID ${errorId}:`, error);
    res.status(500).json({ message: 'Failed to delete document', error: message });
  }
});

export default router;