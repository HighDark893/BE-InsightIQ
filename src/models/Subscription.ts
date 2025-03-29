export class Subscription {
  id: number;
  tenantId: number;
  planId: number;
  status: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: number,
    tenantId: number,
    planId: number,
    status: string,
    startDate: Date,
    endDate: Date,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.planId = planId;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
