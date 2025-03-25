import { Request, Response, Router } from 'express';
import { ProxyService } from '../services/ProxyService';
import { Logger } from '../utils/Logger';

const router = Router();
const proxyService = new ProxyService();
const logger = Logger.getInstance();

router.post('/', async (req: Request, res: Response) => {
    return await proxyService.proxyRequest(req.body);
});

export default router;
