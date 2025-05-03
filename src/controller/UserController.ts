import { Request, Response, Router } from 'express';
import { Logger } from '../utils/Logger';
import { UserService } from '../services/UserService';
import { UserDto } from '../dto/user.dto';
import { authorize, requireAuthentication } from '../middleware/auth.middleware';

const router = Router();
const userService = new UserService();
const logger = Logger.getInstance();

router.post('/create', requireAuthentication, async (req: Request, res: Response) => {
  try {
    const userDto: UserDto = req.body;
    const result = await userService.createUserRequest(userDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating user', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.post('/updatepassword', requireAuthentication, async (req: Request, res: Response) => {
  try {
    const userDto: UserDto = req.body;
    const result = await userService.updateUserPassword(userDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error updating user password', error);
    res.status(500).json({ error: 'internal server error' });
  }
})

router.delete('/delete',requireAuthentication, async (req: Request, res: Response) => {
  try {
    const userDto: UserDto = req.body;
    const result = await userService.deleteUser(userDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error deleting user', error);
    res.status(500).json({ error: 'internal server error' });
  }
})

export default router;
