import { ChatSessionEntity } from '../entity/chatSession.entity';

export class ChatSessionDto {
  id: number;
  userChatbotId: number;
  tenantId: number;
  sessionToken: string;

  public static fromEntity(entity: ChatSessionEntity) {
    const chatSessionDto = new ChatSessionDto();
    chatSessionDto.id = entity.id;
    chatSessionDto.userChatbotId = entity.userChatbotId;
    chatSessionDto.sessionToken = entity.sessionToken;
    return chatSessionDto;
  }
}
