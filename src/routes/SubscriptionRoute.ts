import { Router } from 'express';
import SubscriptionController from '../controller/SubscriptionController';

const router = Router();

router.get('/', SubscriptionController.getAllSubscriptions);
router.get('/:id', SubscriptionController.getSubscriptionById);
router.post('/', SubscriptionController.createSubscription);
router.put('/:id', SubscriptionController.updateSubscription);
router.patch('/:id/cancel', SubscriptionController.cancelSubscription);
router.delete('/:id', SubscriptionController.deleteSubscription);

export default router;
