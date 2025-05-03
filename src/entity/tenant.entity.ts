import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { DocumentEntity } from './document.entity';

@Entity({
    name: 'TENANT',
})
export class TenantEntity extends BaseEntity {
    @PrimaryGeneratedColumn({
        name: 'ID',
    })
    id: number;

    @Column({
        name: 'COMPANY_NAME',
    })
    companyName: string;

    @Column({
        name: 'FULL_NAME',
    })
    fullName: string;

    @Column({
        name: 'TAX_ID',
    })
    taxId: number;

    @Column({
        name: 'STATUS',
    })
    status: string;

    @OneToOne(() => UserEntity, (user) => user.tenant)
    @JoinColumn({ name: 'USER_ID' })
    user: UserEntity;

    @OneToMany(() => DocumentEntity, (document) => document.tenant)
    documents: DocumentEntity[];
}
