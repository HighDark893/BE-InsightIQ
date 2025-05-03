import { Request, Response, Router } from "express";
import { AuthService } from '../services/AuthService';



const router = Router();
const authService = new AuthService();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const {email, password} = req.body;
    const token = await authService.login(email, password);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: false, // Set true in production (HTTPS)
      sameSite: 'strict',
    });

    res.status(200).json({token});
  } catch (error) {
    res.status(500).json({message: 'Failed to login', error});
  }
});


export default router;
