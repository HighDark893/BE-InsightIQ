import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

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

    // @Column({
    //     name: 'USER_ID',
    // })
    // userId: string;

    @OneToOne(() => UserEntity, (user) => user.superAdmin)
    @JoinColumn({ name: 'USER_ID' })
    user: UserEntity;
}
