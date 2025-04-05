import { Router } from "express";
import { SubscriptionController } from "../controllers/SubscriptionController";

const router = Router();
const controller = new SubscriptionController();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.patch("/:id/cancel", controller.);
router.delete("/:id", controller.delete);

export default router;
