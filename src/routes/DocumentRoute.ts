import express from 'express';
import { DocumentController } from '../controllers/DocumentController';

const router = express.Router();

router.get('/', DocumentController.getAll);
router.get('/:id', DocumentController.getById);
router.post('/', DocumentController.create);
router.put('/:id', DocumentController.update);
router.delete('/:id', DocumentController.delete);

export default router;
