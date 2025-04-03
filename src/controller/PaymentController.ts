import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';

export class PaymentController {
  static async getAll(req: Request, res: Response) {
    const payments = await PaymentService.getAllPayments();
    res.json(payments);
  }

  static async getById(req: Request, res: Response) {
    const payment = await PaymentService.getPaymentById(Number(req.params.id));
    payment
      ? res.json(payment)
      : res.status(404).json({ message: 'Not found' });
  }

  static async create(req: Request, res: Response) {
    const payment = await PaymentService.createPayment(req.body);
    res.status(201).json(payment);
  }

  static async update(req: Request, res: Response) {
    const payment = await PaymentService.updatePayment(
      Number(req.params.id),
      req.body,
    );
    res.json(payment);
  }

  static async delete(req: Request, res: Response) {
    await PaymentService.deletePayment(Number(req.params.id));
    res.json({ message: 'Deleted successfully' });
  }
}
