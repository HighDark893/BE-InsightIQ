import { Router } from 'express';
import {
  getChatSessions,
  getChatSession,
  createChatSession,
  deleteChatSession,
} from '../controller/ChatSessionController';

const router = Router();

router.get('/', getChatSessions);
router.get('/:id', getChatSession);
router.post('/', createChatSession);
router.delete('/:id', deleteChatSession);

export default router;
