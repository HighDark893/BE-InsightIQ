import { Router } from 'express';
import { SubscriptionPlanController } from '../controller/SubscriptionPlanController';

const router = Router();

router.get('/', SubscriptionPlanController.getAllPlans);
router.get('/:id', SubscriptionPlanController.getPlanById);
router.post('/', SubscriptionPlanController.createPlan);
router.put('/:id', SubscriptionPlanController.updatePlan);
router.delete('/:id', SubscriptionPlanController.deletePlan);

export default router;
