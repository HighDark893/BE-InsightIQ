import { Request, Response, Router } from 'express';
import { MessageService } from '../services/MessageService';
import { CreateMessageDto } from '../dto/createMessage.dto';

const router = Router();
const messageService = new MessageService();

router.post('/', async (req: Request, res: Response) => {
  try {
    const createMessageDto: CreateMessageDto = req.body;

    const messageDto = await messageService.create(createMessageDto);
    res.status(201).json(messageDto);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create message', error });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const messages = await messageService.getAll();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const messageDto = await messageService.getById(id);

    res.status(200).json(messageDto);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch message', error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
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
