import { Request, Response, Router } from 'express';
import { MessageService } from '../services/MessageService';
import { CreateMessageDto } from '../dto/createMessage.dto';
import { Sender } from '../constants/sender.enum';
import { requireAuthentication, authorize } from '../middleware/auth.middleware';

const router = Router();
const messageService = new MessageService();

router.post('/', requireAuthentication, authorize(['TENANT']), async (req: Request, res: Response) => {
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
});

router.get('/', requireAuthentication, authorize(['TENANT']), async (req: Request, res: Response) => {
  try {
    const messages = await messageService.getAll();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error });
  }
});

router.get('/:chatSessionId', requireAuthentication, authorize(['SUPERADMIN', 'TENANT']), async (req: Request, res: Response) => {
  try {
    const chatSessionId = parseInt(req.params.chatSessionId);
    const messageDto = await messageService.getByChatSessionId(chatSessionId);

    res.status(200).json(messageDto);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch message', error });
  }
});

router.delete('/:id', requireAuthentication, authorize(['SUPERADMIN', 'TENANT']), async (req: Request, res: Response) => {
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
});

export default router;
