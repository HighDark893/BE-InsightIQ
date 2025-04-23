import { Request, Response, Router } from 'express';
import { FeedbackService } from '../services/FeedbackService';
import { CreateFeedbackDto } from '../dto/createFeedback.dto';
import { Rating } from '../constants/RatingEnum';

const router = Router();
const feedbackService = new FeedbackService();

router.post('/', async (req: Request, res: Response) => {
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
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const feedbacks = await feedbackService.getAll();
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedbacks', error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const feedback = await feedbackService.getById(id);

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await feedbackService.delete(id);
    if (!success) {
      res.status(404).json({ message: 'Feedback not found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete feedback', error });
  }
});

export default router;
