import { Request, Response, Router } from 'express';
import { MessageService } from '../services/MessageService';
import { CreateMessageDto } from '../dto/createMessage.dto';
import { Sender } from '../constants/sender.enum';
import {
  requireAuthentication,
  authorize,
} from '../middleware/auth.middleware';

const router = Router();
const messageService = new MessageService();

router.post(
  '/',
  requireAuthentication,
  authorize(['TENANT', 'USERCHATBOT']),
  async (req: Request, res: Response) => {
    try {
      const createMessageDto = new CreateMessageDto();

      createMessageDto.sender = req.body.sender as Sender;
      createMessageDto.content = req.body.content;
      createMessageDto.chatSessionId = req.body.chatSessionId;

      const messageDto = await messageService.create(createMessageDto);
      res.status(201).json(messageDto);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create message', error });
    }
  },
);

router.get(
  '/',
  requireAuthentication,
  authorize(['TENANT', 'USERCHATBOT']),
  async (req: Request, res: Response) => {
    try {
      const messages = await messageService.getAll();
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages', error });
    }
  },
);

router.get(
  '/:chatSessionId',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT', 'USERCHATBOT']),
  async (req: Request, res: Response) => {
    try {
      const chatSessionId = parseInt(req.params.chatSessionId);
      const messageDto = await messageService.getByChatSessionId(chatSessionId);

      res.status(200).json(messageDto);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch message', error });
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
      const success = await messageService.delete(id);
      if (!success) {
        res.status(404).json({ message: "Message doesn't exist." });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete message', error });
    }
  },
);

router.get(
  '/detail/:id', // Path for fetching a single message
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']), // Adjust roles as necessary
  async (req: Request, res: Response): Promise<void> => {
    // Explicitly Promise<void>
    try {
      const id = parseInt(req.params.id, 10); // Added radix 10 for parseInt

      if (isNaN(id)) {
        // Use return to exit after sending response
        res.status(400).json({ message: 'Invalid message ID format' });
        return;
      }

      const messageDto = await messageService.getById(id);

      if (!messageDto) {
        // Use return
        res.status(404).json({ message: 'Message not found' });
        return;
      }
      res.status(200).json(messageDto); // This sends the response
      // No explicit return needed here as res.json() handles the response sending
    } catch (error) {
      // Log the error for server-side debugging
      console.error('Error fetching message detail:', error);
      // Check if headers have already been sent before trying to send another response
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to fetch message details' });
      }
    }
  },
);
export default router;
