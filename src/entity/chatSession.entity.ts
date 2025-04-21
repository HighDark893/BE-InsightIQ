import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity({
  name: 'chat_session',
})
export class ChatSessionEntity extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
  })
  id: number;

  @Column({
    name: 'user_chatbot_id',
  })
  userChatbotId: number;

  @Column({
    name: 'tenant_id',
  })
  tenantId: number;

  @Column({
    name: 'session_token',
  })
  sessionToken: string;
}
