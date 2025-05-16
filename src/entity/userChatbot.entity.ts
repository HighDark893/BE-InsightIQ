import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { UserEntity } from './user.entity';

@Entity('USER_CHATBOT')
export class UserChatbotEntity {
  @PrimaryGeneratedColumn({
    name: 'ID',
  })
  id: number;

  @Column({
    name: 'TENANT_ID',
  })
  tenantId: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.userChatbots)
  @JoinColumn({ name: 'TENANT_ID' })
  tenant: TenantEntity;

  @Column({
    name: 'NAME',
  })
  name: string;

  @Column({
    name: 'PHONE_NUMBER',
  })
  phoneNumber: string;
}
