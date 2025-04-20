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

export default router;

// export const getChatSessions = async (req: Request, res: Response) => {
//   try {
//     const chatSessions = await chatSessionService.getAllChatSessions();
//     res.json(chatSessionService);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch chat sessions', error });
//   }
// };

// export const getChatSession = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     const chatSession = await chatSessionService.getChatSessionById(id);
//     if (!chatSession) {
//       return res.status(404).json({ message: 'Chat session not found' });
//     }
//     res.json(chatSession);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch chat session', error });
//   }
// };

// export const createChatSession = async (req: Request, res: Response) => {
//   try {
//     const { userChatbotId, tenantId, sessionToken } = req.body;

//     if (
//       typeof userChatbotId !== 'number' ||
//       typeof tenantId !== 'number' ||
//       typeof sessionToken !== 'string'
//     ) {
//       return res.status(400).json({ message: 'Invalid input' });
//     }

//     const chatSession = await chatSessionService.create(
//       userChatbotId,
//       tenantId,
//       sessionToken,
//     );
//     res.status(201).json(chatSession);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create chat session', error });
//   }
// };

// export const deleteChatSession = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     const success = await chatSessionService.deleteChatSession(id);
//     if (!success) {
//       return res.status(404).json({ message: 'Chat session not found' });
//     }
//     res.status(204).send();
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete chat session', error });
//   }
// };
