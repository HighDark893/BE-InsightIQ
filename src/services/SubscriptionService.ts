import SubscriptionModel from '../models/SubscriptionModel';
import SubscriptionPlanModel from '../models/SubscriptionPlanModel';

interface SubscriptionData {
  tenantId: number;
  planId: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: 'active' | 'pending';
}

class SubscriptionService {
  async getAllSubscriptions(filters: Record<string, any> = {}): Promise<any[]> {
    return await SubscriptionModel.findAll(filters);
  }

  async getSubscriptionById(id: number): Promise<any | null> {
    return await SubscriptionModel.findById(id);
  }

  async createSubscription(subscriptionData: SubscriptionData): Promise<any> {
    await this.validateSubscriptionData(subscriptionData);

    // Tính ngày kết thúc
    if (!subscriptionData.endDate) {
      const plan = await SubscriptionPlanModel.findById(
        subscriptionData.planId,
      );
      if (plan) {
        const startDate = subscriptionData.startDate
          ? new Date(subscriptionData.startDate)
          : new Date();
        const endDate = new Date(startDate);

        switch (plan.Billing_cycle.toLowerCase()) {
          case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case 'quarterly':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          default:
            endDate.setMonth(endDate.getMonth() + 1);
        }

        subscriptionData.endDate = endDate.toISOString();
      }
    }

    return await SubscriptionModel.create(subscriptionData);
  }

  async updateSubscription(
    id: number,
    subscriptionData: SubscriptionData,
  ): Promise<any | null> {
    await this.validateSubscriptionData(subscriptionData);

    const subscription = await SubscriptionModel.findById(id);
    if (!subscription) {
      return null;
    }

    return await SubscriptionModel.update(id, subscriptionData);
  }

  async cancelSubscription(id: number): Promise<any | null> {
    const subscription = await SubscriptionModel.findById(id);
    if (!subscription) {
      return null;
    }

    return await SubscriptionModel.updateStatus(id, 'cancelled');
  }

  async deleteSubscription(id: number): Promise<boolean> {
    return await SubscriptionModel.delete(id);
  }

  private async validateSubscriptionData(
    data: SubscriptionData,
  ): Promise<boolean> {
    if (!data.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!data.planId) {
      throw new Error('Plan ID is required');
    }

    // Validate if Plan exists
    const plan = await SubscriptionPlanModel.findById(data.planId);
    if (!plan) {
      throw new Error('Invalid Plan ID');
    }

    if (
      data.status &&
      !['active', 'cancelled', 'expired', 'pending'].includes(data.status)
    ) {
      throw new Error('Invalid status');
    }

    return true;
  }
}

export default new SubscriptionService();
