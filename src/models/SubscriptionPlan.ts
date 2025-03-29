export class SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  billingCycle: string;
  maxMessages: number;
  extraCost: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    price: number,
    billingCycle: string,
    maxMessages: number,
    extraCost: number,
  ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.billingCycle = billingCycle;
    this.maxMessages = maxMessages;
    this.extraCost = extraCost;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
