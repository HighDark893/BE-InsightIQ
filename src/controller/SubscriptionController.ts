import { Request, Response } from "express";
import { SubscriptionService } from "../services/SubscriptionService";

const service = new SubscriptionService();

export class SubscriptionController {
  async getAll(req: Request, res: Response) {
    res.json(await service.getAllSubscriptions());
  }

  async getById(req: Request, res: Response) {
    res.json(await service.getSubscriptionById(parseInt(req.params.id)));
  }

  async create(req: Request, res: Response) {
    res.json(await service.createSubscription(req.body));
  }

  async update(req: Request, res: Response) {
    res.json(
      await service.updateSubscription(parseInt(req.params.id), req.body)
    );
  }

  async delete(req: Request, res: Response) {
    res.json(await service.deleteSubscription(parseInt(req.params.id)));
  }
}
