import { Request, Response, Router } from 'express';
import { Logger } from '../utils/Logger';
import { TenantDto } from '../dto/tenant.dto';
import { TenantService } from '../services/TenantService';
import {
  authorize,
  getUserInfo,
  requireAuthentication,
} from '../middleware/auth.middleware';

const router = Router();
const tenantService = new TenantService();
const logger = Logger.getInstance();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const tenantDto: TenantDto = req.body;
    const result = await tenantService.createTenantRequest(tenantDto);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating tenant', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.post(
  '/update',
  requireAuthentication,
  authorize(['SUPERADMIN', 'TENANT']),
  async (req: Request, res: Response) => {
    try {
      const tenantDto: TenantDto = req.body;
      const result = await tenantService.updateTenant(tenantDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error updating tenant', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.delete(
  '/delete',
  requireAuthentication,
  authorize(['SUPERADMIN']),
  async (req: Request, res: Response) => {
    try {
      const tenantDto: TenantDto = req.body;
      const result = await tenantService.deleteTenant(tenantDto);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error deleting tenant', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
);

router.get(
  '/',
  requireAuthentication,
  authorize(['SUPERADMIN']),
  async (req: Request, res: Response) => {
    try {
      const result = await tenantService.getAllTenants();
      res.status(201).json(req.body);
    } catch (error) {
      console.error('Error updating tenant', error);
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
      const id = parseInt(req.params.id);
      const result = await tenantService.getTenantById(id);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tenant', error });
    }
  },
);

router.get(
  '/api/myInfo',
  requireAuthentication,
  authorize(['TENANT']),
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
