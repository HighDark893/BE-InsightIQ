import { Request, Response, Router } from 'express';
import { FeedbackService } from '../services/FeedbackService';
import { CreateFeedbackDto } from '../dto/createFeedback.dto';
import { Rating } from '../constants/rating.enum';
import {
  authorize,
  requireAuthentication,
} from '../middleware/auth.middleware';

const router = Router();
const feedbackService = new FeedbackService();

router.post(
  '/',
  requireAuthentication,
  authorize(['USERCHATBOT']),
  async (req: Request, res: Response) => {
    try {
      const createFeedbackDto = new CreateFeedbackDto();

      createFeedbackDto.rating = req.body.rating as Rating;
      createFeedbackDto.comment = req.body.comment;
      createFeedbackDto.messageId = req.body.messageId;

      const feedbackDto = await feedbackService.create(createFeedbackDto);
      res.status(201).json(feedbackDto);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create feedback', error });
    }
  },
);

router.get(
  '/',
  requireAuthentication,
  authorize(['SUPERADMIN']),
  async (req: Request, res: Response) => {
    try {
      const feedbacks = await feedbackService.getAll();
      res.json(feedbacks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feedbacks', error });
    }
  },
);

router.get(
  '/:id',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT', 'USERCHATBOT']),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const feedback = await feedbackService.getById(id);

      res.status(200).json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feedback', error });
    }
  },
);

router.delete(
  '/:id',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await feedbackService.delete(id);
      if (!success) {
        res.status(404).json({ message: 'Feedback not found' });
      } else {
        res.status(200).send();
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete feedback', error });
    }
  },
);

router.get('/summary/countRatings', async (req: Request, res: Response) => {
  try {
    const result = await feedbackService.countAllRatings();

    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to count all feedbacks', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get(
  '/summary/countRatings/:tenantId',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const ratingCount = await feedbackService.countRatingByTenantId(tenantId);

      res.status(200).json(ratingCount);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to fetch ratings amount', error });
    }
  },
);

router.get(
  '/summary/allFeedbacks/:tenantId',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const feedbacks = await feedbackService.getFeedbacksByTenantId(tenantId);

      res.status(200).json(feedbacks);
    } catch (error) {
      console.error('Failed to get feedbacks by tenant id', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
);

export default router;
