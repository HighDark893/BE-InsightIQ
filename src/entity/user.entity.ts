import {
  BaseEntity,
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SuperAdminEntity } from './superadmin.entity';
import { TenantEntity } from './tenant.entity';

@Entity({
  name: 'USER',
})
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'ID',
  })
  id: number;

  @Column({
    name: 'EMAIL',
  })
  email: string;

  @Column({
    name: 'PHONE_NUMBER',
  })
  phoneNumber: string;
  @Column({
    name: 'PASSWORD_HASH',
  })
  passwordHash: string;

  @OneToOne(() => SuperAdminEntity, (admin) => admin.user)
  superAdmin: SuperAdminEntity;

  @OneToOne(() => TenantEntity, (tenant) => tenant.user)
  tenant: TenantEntity;
}
