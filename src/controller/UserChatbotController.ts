import { Request, Response, Router } from 'express';
import { Logger } from '../utils/Logger';
import {
  authorize,
  requireAuthentication,
} from '../middleware/auth.middleware';
import { UserChatbotDto } from '../dto/userChatbot.dto';
import { UserChatbotService } from '../services/UserChatbotService';

const router = Router();
const userChatbotService = new UserChatbotService();
const logger = Logger.getInstance();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const userChatbotDto: UserChatbotDto = req.body;
    const result =
      await userChatbotService.createUserChatbotRequest(userChatbotDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating user chatbot', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await userChatbotService.getAllUserChatbot();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching user chatbot', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await userChatbotService.getUserChatbotById(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching user chatbot', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.delete(
  '/:id',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const userChatbotDto: UserChatbotDto = req.body;
      userChatbotDto.id = parseInt(req.params.id);

      const result = await userChatbotService.deleteUserChatbot(userChatbotDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error deleting user chatbot', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

export default router;
