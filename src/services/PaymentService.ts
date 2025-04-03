import Payment from '../models/payment';

export class PaymentService {
  static async getAllPayments() {
    return await Payment.findAll();
  }

  static async getPaymentById(id: number) {
    return await Payment.findByPk(id);
  }

  static async createPayment(data: any) {
    return await Payment.create(data);
  }

  static async updatePayment(id: number, data: any) {
    await Payment.update(data, { where: { id } });
    return await Payment.findByPk(id);
  }

  static async deletePayment(id: number) {
    return await Payment.destroy({ where: { id } });
  }
}
