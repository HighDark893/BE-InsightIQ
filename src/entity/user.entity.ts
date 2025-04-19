import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
