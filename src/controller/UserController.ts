import { Request, Response, Router } from 'express';
import { Logger } from '../utils/Logger';
import { UserService } from '../services/UserService';
import { UserDto } from '../dto/user.dto';
import {
  authorize,
  requireAuthentication,
} from '../middleware/auth.middleware';

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

router.post(
  '/updatepassword',
  requireAuthentication,
  async (req: Request, res: Response) => {
    try {
      const userDto: UserDto = req.body;
      const result = await userService.updateUserPassword(userDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error updating user password', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.post(
  '/update',
  requireAuthentication,
  async (req: Request, res: Response) => {
    try {
      const userDto: UserDto = req.body;
      const result = await userService.updateUser(userDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error updating user', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.delete(
  '/delete',
  requireAuthentication,
  async (req: Request, res: Response) => {
    try {
      const userDto: UserDto = req.body;
      const result = await userService.deleteUser(userDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error deleting user', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.get(
  '/:id',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const result = await userService.getUserById(userId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error getting user details', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.get(
  '/password/:id',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const userDto = await userService.getUserPasswordById(userId);
      res.status(201).json(userDto);
    } catch (error) {
      console.error('Error get user password', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

export default router;
