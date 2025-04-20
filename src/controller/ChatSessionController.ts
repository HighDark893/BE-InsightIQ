import { Request, Response, Router } from 'express';
import { ChatSessionService } from '../services/ChatSessionService';
import { CreateChatSessionDto } from '../dto/createChatSession.dto';

const router = Router();
const chatSessionService = new ChatSessionService();

router.post('/', async (req: Request, res: Response) => {
  try {
    const createChatSessionDto: CreateChatSessionDto = req.body;

    const chatSessionDto =
      await chatSessionService.create(createChatSessionDto);
    res.status(201).json(chatSessionDto);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat session', error });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const chatSessions = await chatSessionService.getAll();
    res.status(200).json(chatSessions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat sessions', error });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const chatSession = await chatSessionService.getById(id);

    res.status(200).json(chatSession);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat session', error });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await chatSessionService.delete(id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete chat session', error });
  }
});

export default router;
