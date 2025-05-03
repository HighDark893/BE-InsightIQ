import { Request, Response, Router } from 'express';
import { DocumentService } from '../services/DocumentService';
import { CreateDocumentDto } from '../dto/createDocument.dto';
import { authorize, requireAuthentication } from '../middleware/auth.middleware';

const router = Router();
const documentService = new DocumentService();

router.post('/',  requireAuthentication, authorize(['TENANT']), async (req: Request, res: Response) => {
  try {
    const createDocumentDto = new CreateDocumentDto();

    createDocumentDto.fileName = req.body.fileName;
    createDocumentDto.fileUrl = req.body.fileUrl;
    createDocumentDto.tenantId = req.body.tenantId;

    const documentDto = await documentService.create(createDocumentDto);
    res.status(201).json(documentDto);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create document', error });
  }
});

router.get('/', requireAuthentication, authorize(['TENANT']), async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getAll();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error });
  }
});

router.get('/:tenantId', requireAuthentication, authorize(['SUPERADMIN', 'TENANT']), async (req: Request, res: Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const documents = await documentService.getByTenantId(tenantId);

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error });
  }
});

router.delete('/:id', requireAuthentication, authorize(['TENANT']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await documentService.delete(id);

    if (!success) {
      res.status(404).json({ message: 'Document not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error });
  }
});

export default router;
