import { Request, Response, Router } from 'express';
import { Logger } from '../../utils/Logger';
import {SuperAdminService} from "../../services/user/SuperAdminService";
import {SuperAdminDto} from "../../dto/user/superadmin.dto";

const router = Router();
const superAdminService = new SuperAdminService();
const logger = Logger.getInstance();

router.post('/create', async (req: Request, res: Response) => {
    try {
        const superAdminDto: SuperAdminDto = req.body;
        const result = await superAdminService.createSuperAdminRequest(superAdminDto);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating super admin', error);
        res.status(500).json({ error: 'internal server error' });
    }
});

export default router;
