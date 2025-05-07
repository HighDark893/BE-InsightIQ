import { Request, Response, Router } from 'express';
import { AuthService } from '../services/AuthService';
import { requireAuthentication } from '../middleware/auth.middleware';

const router = Router();
const authService = new AuthService();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (!result) {
      res.status(500).json({ message: 'Failed to login' });
    } else {
      const token = result.token;
      const role = result.role;

      if (!token) {
        res
          .status(400)
          .json({ message: "Something's wrong with user's email or password" });
      } else {
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: false, // Set true in production (HTTPS)
          sameSite: 'strict',
        });

        res.status(200).json({ role });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to login', error });
  }
});

router.post('/user_chatbot/login', async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber } = req.body;
    const token = await authService.userChatbotLogin(name, phoneNumber);

    if (!token) {
      res
        .status(400)
        .json({ message: "Something's wrong with user's email or password" });
    } else {
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: false, // Set true in production (HTTPS)
        sameSite: 'strict',
      });

      res.status(200).json({ token });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to login', error });
  }
});

router.post(
  '/logout',
  requireAuthentication,
  async (req: Request, res: Response) => {
    try {
      res.clearCookie('auth_token');
      res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to logout', error });
    }
  },
);

export default router;
