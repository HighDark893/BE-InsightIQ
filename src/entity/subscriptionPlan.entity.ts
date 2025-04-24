import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MonthlyBillingCycle } from '../constants/MonthlyBillingCycleEnum';

@Entity({
  name: 'subscription_plan',
})
export class SubscriptionPlanEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'price',
  })
  price: number;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: MonthlyBillingCycle,
  })
  billingCycle: MonthlyBillingCycle;

  @Column({
    name: 'max_messages',
  })
  maxMessages: number;

  @Column({
    name: 'extra_cost',
  })
  extraCost: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
