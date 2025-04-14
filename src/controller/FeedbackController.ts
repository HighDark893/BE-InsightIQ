import { Request, Response } from 'express';
import { FeedbackService } from '../services/FeedbackService';

const feedbackService = new FeedbackService();

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await feedbackService.getAllFeedbacks();
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedbacks', error });
  }
};

export const getFeedback = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const feedback = await feedbackService.getFeedbackById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error });
  }
};

export const createFeedback = async (req: Request, res: Response) => {
  try {
    const { chatSessionId, rating, content } = req.body;

    if (
      typeof chatSessionId !== 'number' ||
      typeof rating !== 'string' ||
      typeof content !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const feedback = await feedbackService.createFeedback(
      chatSessionId,
      rating,
      content,
    );
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat session', error });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await feedbackService.deleteFeedback(id);
    if (!success) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete feedback', error });
  }
};
