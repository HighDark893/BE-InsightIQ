import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { UserChatbotEntity } from './userChatbot.entity';
import { TenantEntity } from './tenant.entity';

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

  @OneToMany(() => MessageEntity, (message) => message.chatSession)
  messages: MessageEntity[];

  @OneToOne(() => UserChatbotEntity)
  @JoinColumn({
    name: 'user_chatbot_id',
  })
  userChatbot: UserChatbotEntity;

  @ManyToOne(() => TenantEntity, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;
}
