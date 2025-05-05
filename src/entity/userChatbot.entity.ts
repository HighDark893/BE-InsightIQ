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

  @ManyToOne(() => TenantEntity, { nullable: false })
  @JoinColumn({ name: 'TENANT_ID' })
  tenant: TenantEntity;

  @OneToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'USER_ID' })
  user: UserEntity;

  @Column({
    name: 'NAME',
  })
  name: string;

}
