import { MonthlyBillingCycle } from '../constants/MonthlyBillingCycleEnum';

export class SubscriptionPlanDto {
  id: number;
  name: string;
  price: number;
  billingCycle: number;
  maxMessages: number;
  extra_cost: number;
}
