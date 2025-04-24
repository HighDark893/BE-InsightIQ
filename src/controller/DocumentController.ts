import { Request, Response, Router } from 'express';
import { DocumentService } from '../services/DocumentService';
import { CreateDocumentDto } from '../dto/createDocument.dto';

const router = Router();
const documentService = new DocumentService();

router.post('/', async (req: Request, res: Response) => {
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

export default router;
