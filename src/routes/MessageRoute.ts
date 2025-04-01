import { Router } from 'express';

import {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
} from '../controller/MessageController';

const router = Router();

router.get('/', getMessages);
router.get('/:id', getMessage);
router.post('/', createMessage);
router.put('/:id', updateMessage);
router.delete('/:id', deleteMessage);

export default router;
