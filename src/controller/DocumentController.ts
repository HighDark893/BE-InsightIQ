// src/controller/DocumentController.ts

import { Request, Response, Router } from 'express';
import { UploadDocumentService } from '../services/document/UploadDocumentService';
import { DeleteDocumentService } from '../services/document/DeleteDocumentService';
import { DocumentDto } from '../dto/document.dto';
import multer from 'multer';
import { DocumentService } from '../services/document/DocumentService'; // Import DocumentService
import { CreateDocumentDto } from '../dto/createDocument.dto';
import {
  authorize,
  requireAuthentication,
} from '../middleware/auth.middleware';

const router = Router();
const uploadDocumentService = new UploadDocumentService();
const deleteDocumentService = new DeleteDocumentService();
const documentService = new DocumentService(); // Khởi tạo DocumentService cho GET

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Route POST ---
router.post(
  '/upload',
  requireAuthentication,
  authorize(['TENANT']), //ensures only tenants can upload
  upload.single('file'), // Handles the file part
  async (req: Request, res: Response): Promise<void> => {
    try {
      // --- File Validation ---
      if (!req.file) {
        console.warn('[DocController] Upload request missing file.');
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      // --- Body Data Validation ---
      const { validFrom, validUntil } = req.body;
      // Add // @ts-ignore above the next line if you encounter type errors for req.user
      // @ts-ignore
      const tenantIdFromAuth = req.user?.tenantId; // Get tenantId from the decoded JWT payload

      // --- Add Validation for tenantId from Auth ---
      if (tenantIdFromAuth === undefined || tenantIdFromAuth === null) {
        console.warn(
          '[DocController] Upload request missing tenantId in authenticated user context.',
        );
        // Use 401 Unauthorized or 403 Forbidden as appropriate
        res
          .status(401)
          .json({ message: 'Unauthorized or tenant ID not found in token.' });
        return;
      }
      // --- End Validation ---

      // Ensure tenantId is a number before passing to the service
      const tenantId = parseInt(tenantIdFromAuth, 10);
      if (isNaN(tenantId)) {
        console.warn(
          `[DocController] Invalid Tenant ID format from token: ${tenantIdFromAuth}`,
        );
        res.status(400).json({ message: 'Invalid Tenant ID format in token.' });
        return;
      }
      // --- Date Validation (Basic) ---
      if (!validFrom || !validUntil) {
        console.warn(
          '[DocController] Upload request missing validFrom or validUntil.',
        );
        res
          .status(400)
          .json({ message: 'validFrom and validUntil dates are required.' });
        return;
      }
      // Optional: Add more robust date string validation (e.g., regex YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(validFrom) || !dateRegex.test(validUntil)) {
        console.warn(
          `[DocController] Invalid date format for validFrom (${validFrom}) or validUntil (${validUntil}). Expected YYYY-MM-DD.`,
        );
        res
          .status(400)
          .json({ message: 'Invalid date format. Please use YYYY-MM-DD.' });
        return;
      }

      // --- Call Service with Date Info ---
      const savedDocument: DocumentDto =
        await uploadDocumentService.uploadAndSave(
          req.file,
          tenantId,
          validFrom, // Pass validFrom
          validUntil, // Pass validUntil
        );

      console.info(
        `[DocController] Upload successful, returning document ID: ${savedDocument.id}`,
      );
      res.status(201).json(savedDocument);
    } catch (error: any) {
      console.error('[DocController] Error processing file upload:', {
        error: error.message,
        stack: error.stack,
      }); // Log error details
      res.status(500).json({
        message: 'Failed to process file upload.',
        error: error.message || 'Unknown server error',
      });
    }
  },
);

// --- Route GET ---
router.get(
  '/',
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
    try {
      const documents = await documentService.getAll(); // Dùng documentService
      res.status(200).json(documents);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error fetching documents';
      console.error('Failed to fetch documents:', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch documents', error: message });
    }
  },
);

router.get(
  '/:tenantId',
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.params.tenantId) {
        res.status(400).json({ message: 'Tenant ID parameter is required.' });
        return;
      }
      const tenantId = parseInt(req.params.tenantId, 10);
      if (isNaN(tenantId)) {
        res
          .status(400)
          .json({ message: 'Invalid Tenant ID parameter format.' });
        return;
      }
      const documents = await documentService.getByTenantId(tenantId); // Dùng documentService
      res.status(200).json(documents);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error fetching documents by tenant';
      console.error('Failed to fetch documents by tenant:', error);
      res.status(500).json({
        message: 'Failed to fetch documents by tenant',
        error: message,
      });
    }
  },
);

// --- Route DELETE ---
router.delete(
  '/:id',
  // Thêm : Promise<void> ở đây
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.params.id) {
        res.status(400).json({ message: 'Document ID parameter is required.' });
        return;
      }
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res
          .status(400)
          .json({ message: 'Invalid Document ID parameter format.' });
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
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error deleting document';
      // Kiểm tra xem id có tồn tại trên req.params không trước khi log
      const errorId = req.params.id || 'UNKNOWN';
      console.error(`[Router] Failed to delete document ID ${errorId}:`, error);
      res
        .status(500)
        .json({ message: 'Failed to delete document', error: message });
    }
  },
);

export default router;
