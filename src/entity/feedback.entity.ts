import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Rating } from '../constants/rating.enum';
import { MessageEntity } from './message.entity';

@Entity({
  name: 'feedback',
})
export class FeedbackEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'rating',
    type: 'enum',
    enum: Rating,
  })
  rating: Rating;

  @Column({
    name: 'comment',
    nullable: true,
  })
  comment: string;

  @Column({
    name: 'message_id',
  })
  messageId: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @OneToOne(() => MessageEntity)
  @JoinColumn({
    name: 'message_id',
  })
  message: MessageEntity;
}
