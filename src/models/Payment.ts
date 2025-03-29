export class Payment {
  id: number;
  tenantId: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: Date;

  constructor(
    id: number,
    tenantId: number,
    subscriptionId: number,
    amount: number,
    currency: string,
    status: string,
    paymentMethod: string,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.subscriptionId = subscriptionId;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.paymentMethod = paymentMethod;
    this.createdAt = new Date();
  }
}
