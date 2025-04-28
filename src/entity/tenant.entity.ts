import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
