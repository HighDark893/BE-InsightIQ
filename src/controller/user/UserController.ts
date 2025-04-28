import { Request, Response, Router } from 'express';
import { Logger } from '../../utils/Logger';
import { UserService } from '../../services/user/UserService';
import { UserDto } from '../../dto/user/user.dto';

const router = Router();
const userService = new UserService();
const logger = Logger.getInstance();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const userDto: UserDto = req.body;
    const result = await userService.createUserRequest(userDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
