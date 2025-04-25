import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

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

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
