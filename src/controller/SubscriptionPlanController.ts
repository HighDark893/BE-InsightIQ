import { Request, Response, NextFunction } from 'express';
import SubscriptionPlanService from '../services/SubscriptionPlanService';

class SubscriptionPlanController {
  async getAllPlans(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const plans = await SubscriptionPlanService.getAllPlans();
      return res.status(200).json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async getPlanById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid plan ID' });

      const plan = await SubscriptionPlanService.getPlanById(id);
      if (!plan)
        return res
          .status(404)
          .json({ success: false, error: 'Subscription plan not found' });

      return res.status(200).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async createPlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const planData = req.body;
      const plan = await SubscriptionPlanService.createPlan(planData);
      return res.status(201).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid plan ID' });

      const planData = req.body;
      const plan = await SubscriptionPlanService.updatePlan(id, planData);
      if (!plan)
        return res
          .status(404)
          .json({ success: false, error: 'Subscription plan not found' });

      return res.status(200).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async deletePlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid plan ID' });

      await SubscriptionPlanService.deletePlan(id);
      return res
        .status(200)
        .json({
          success: true,
          message: 'Subscription plan deleted successfully',
        });
    } catch (err) {
      next(err);
    }
  }
}

export default new SubscriptionPlanController();
