import express from "express";
import { PaymentController } from "../controllers/PaymentController";

const router = express.Router();

router.get("/", PaymentController.getAll);
router.get("/:id", PaymentController.getById);
router.post("/", PaymentController.create);
router.put("/:id", PaymentController.update);
router.delete("/:id", PaymentController.delete);

export default router;
