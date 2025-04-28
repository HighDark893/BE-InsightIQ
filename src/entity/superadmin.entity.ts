import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
    name: 'SUPERADMIN',
})
export class SuperAdminEntity extends BaseEntity {
    @PrimaryGeneratedColumn({
        name: 'ID',
    })
    id: number;

    @Column({
        name: 'USERNAME',
    })
    username: string;
}
