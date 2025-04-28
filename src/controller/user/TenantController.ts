import { Request, Response, Router } from 'express';
import { Logger } from '../../utils/Logger';
import { TenantDto } from '../../dto/user/tenant.dto';
import { TenantService } from '../../services/user/TenantService';

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

export default router;
