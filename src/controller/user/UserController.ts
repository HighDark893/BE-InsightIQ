import { Request, Response, Router } from 'express';
import { ProxyService } from '../../services/ProxyService';
import { Logger } from '../../utils/Logger';
import { UserService } from '../../services/user/UserService';

const router = Router();
const userService = new UserService();
const logger = Logger.getInstance();

router.get('/', async (req: Request, res: Response) => {
  return await userService.createUserRequest(req.body);
});

export default router;
