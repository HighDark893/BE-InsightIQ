import SubscriptionPlanModel from '../models/SubscriptionPlanModel';

interface PlanData {
  name: string;
  price: number;
  billingCycle: string;
  maxMessages: number;
}

export default class SubscriptionPlanService {
  async getAllPlans() {
    return await SubscriptionPlanModel.findAll();
  }

  async getPlanById(id: string) {
    return await SubscriptionPlanModel.findById(id);
  }

  async createPlan(planData: PlanData) {
    this.validatePlanData(planData);
    return await SubscriptionPlanModel.create(planData);
  }

  async updatePlan(id: string, planData: PlanData) {
    this.validatePlanData(planData);
    const plan = await SubscriptionPlanModel.findById(id);

    if (!plan) {
      return null;
    }

    return await SubscriptionPlanModel.update(id, planData);
  }

  async deletePlan(id: string) {
    return await SubscriptionPlanModel.delete(id);
  }

  validatePlanData(data: PlanData): boolean {
    if (!data.name || !data.name.trim()) {
      throw new Error('Plan name is required');
    }

    if (!data.price || isNaN(data.price) || data.price <= 0) {
      throw new Error('Invalid price');
    }

    if (!data.billingCycle) {
      throw new Error('Billing cycle is required');
    }

    if (!data.maxMessages || isNaN(data.maxMessages) || data.maxMessages < 0) {
      throw new Error('Invalid max messages');
    }

    return true;
  }
}
