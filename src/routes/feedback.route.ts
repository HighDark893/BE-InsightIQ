import { Router } from 'express';
import {
  getFeedbacks,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from '../controller/feedback.controller';

const router = Router();

router.get('/', getFeedbacks);
router.get('/:id', getFeedback);
router.post('/', createFeedback);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;
