import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

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

    // @Column({
    //     name: 'USER_ID',
    // })
    // userId: string;

    @OneToOne(() => UserEntity, (user) => user.tenant)
    @JoinColumn({ name: 'USER_ID' })
    user: UserEntity;
}
