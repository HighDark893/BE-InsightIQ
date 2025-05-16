import {
  BaseEntity,
  Column,
  Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

@Entity({
  name: 'document',
})
export class DocumentEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'file_name',
  })
  fileName: string;

  @Column({
    name: 'file_url',
  })
  fileUrl: string;

  @Column({
    name: 'tenant_id',
  })
  tenantId: number;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.documents)
  @JoinColumn({
    name: 'tenant_id',
  })
  tenant: TenantEntity;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
