import { Request, Response, NextFunction } from 'express';
import SubscriptionService from '../services/SubscriptionService';

class SubscriptionController {
  async getAllSubscriptions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const { tenantId, status } = req.query;
      const subscriptions = await SubscriptionService.getAllSubscriptions({
        tenantId: tenantId ? Number(tenantId) : undefined,
        status: status ? String(status) : undefined,
      });

      return res.status(200).json({ success: true, data: subscriptions });
    } catch (err) {
      next(err);
    }
  }

  async getSubscriptionById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid subscription ID' });

      const subscription = await SubscriptionService.getSubscriptionById(id);
      if (!subscription)
        return res
          .status(404)
          .json({ success: false, error: 'Subscription not found' });

      return res.status(200).json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }

  async createSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const subscriptionData = req.body;
      const subscription =
        await SubscriptionService.createSubscription(subscriptionData);
      return res.status(201).json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }

  async updateSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid subscription ID' });

      const subscriptionData = req.body;
      const subscription = await SubscriptionService.updateSubscription(
        id,
        subscriptionData,
      );
      if (!subscription)
        return res
          .status(404)
          .json({ success: false, error: 'Subscription not found' });

      return res.status(200).json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }

  async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid subscription ID' });

      const subscription = await SubscriptionService.cancelSubscription(id);
      if (!subscription)
        return res
          .status(404)
          .json({ success: false, error: 'Subscription not found' });

      return res.status(200).json({ success: true, data: subscription });
    } catch (err) {
      next(err);
    }
  }

  async deleteSubscription(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id))
        return res
          .status(400)
          .json({ success: false, error: 'Invalid subscription ID' });

      await SubscriptionService.deleteSubscription(id);
      return res
        .status(200)
        .json({ success: true, message: 'Subscription deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export default new SubscriptionController();
