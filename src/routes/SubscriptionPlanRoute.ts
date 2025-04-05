import { Router } from "express";
import { SubscriptionPlanController } from "../controllers/subscriptionPlanController";

const router = Router();
const controller = new SubscriptionPlanController();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.delete("/:id", controller.delete);

export default router;
