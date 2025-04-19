import SubscriptionPlan from "../dto/SubscriptionPlan";

export class SubscriptionPlanService {
  async getAllPlans() {
    return await SubscriptionPlan.findAll();
  }

  async getPlanById(id: number) {
    return await SubscriptionPlan.findByPk(id);
  }

  async createPlan(planData: any) {
    return await SubscriptionPlan.create(planData);
  }

  async updatePlan(id: number, planData: any) {
    return await SubscriptionPlan.update(planData, { where: { id } });
  }

  async deletePlan(id: number) {
    return await SubscriptionPlan.destroy({ where: { id } });
  }
}
