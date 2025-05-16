import { Request, Response, Router } from 'express';
import { Logger } from '../utils/Logger';
import { SuperAdminService } from '../services/SuperAdminService';
import { SuperAdminDto } from '../dto/superadmin.dto';
import {
  authorize,
  getUserInfo,
  requireAuthentication,
} from '../middleware/auth.middleware';

const router = Router();
const superAdminService = new SuperAdminService();
const logger = Logger.getInstance();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const superAdminDto: SuperAdminDto = req.body;
    const result =
      await superAdminService.createSuperAdminRequest(superAdminDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating super admin', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.put(
  '/:id',
  requireAuthentication,
  authorize(['SUPERADMIN']),
  async (req: Request, res: Response) => {
    try {
      const superAdminDto: SuperAdminDto = req.body;
      superAdminDto.id = parseInt(req.params.id);

      const result = await superAdminService.updateSuperAdmin(superAdminDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error updating superadmin', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.get(
  '/:id',
  requireAuthentication,
  authorize(['SUPERADMIN']),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await superAdminService.getSuperAdminById(id);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch super admin', error });
    }
  },
);

router.get(
  '/api/myInfo',
  requireAuthentication,
  authorize(['SUPERADMIN']),
  getUserInfo,
  async (req: Request, res: Response) => {
    try {
      const userInfo = req.body;

      res.status(200).json(userInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tenant', error });
    }
  },
);

export default router;
