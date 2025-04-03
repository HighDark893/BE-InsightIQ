import { Request, Response } from 'express';
import { SubscriptionPlanService } from '../services/SubscriptionPlanService';

const service = new SubscriptionPlanService();

export class SubscriptionPlanController {
  async getAll(req: Request, res: Response) {
    res.json(await service.getAllPlans());
  }

  async getById(req: Request, res: Response) {
    res.json(await service.getPlanById(parseInt(req.params.id)));
  }

  async create(req: Request, res: Response) {
    res.json(await service.createPlan(req.body));
  }

  async update(req: Request, res: Response) {
    res.json(await service.updatePlan(parseInt(req.params.id), req.body));
  }

  async delete(req: Request, res: Response) {
    res.json(await service.deletePlan(parseInt(req.params.id)));
  }
}
