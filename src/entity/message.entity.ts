import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sender } from '../constants/SenderEnum';
import { ChatSessionEntity } from './chatSession.entity';

@Entity({
  name: 'message',
})
export class MessageEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'sender',
    type: 'enum',
    enum: Sender,
  })
  sender: Sender;

  @Column({
    name: 'content',
  })
  content: string;

  @Column({
    name: 'chat_session_id',
  })
  chatSessionId: number;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @ManyToOne(() => ChatSessionEntity, (chatSession) => chatSession.messages)
  @JoinColumn({
    name: 'chat_session_id',
  })
  chatSession: ChatSessionEntity;
}
