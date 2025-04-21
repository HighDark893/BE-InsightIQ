import { ChatSessionEntity } from '../entity/chatSession.entity';

export class CreateChatSessionDto {
  userChatbotId: number;
  tenantId: number;
  sessionToken: string;

  public static fromEntity(entity: ChatSessionEntity) {
    const createChatSessionDto = new CreateChatSessionDto();
    createChatSessionDto.userChatbotId = entity.userChatbotId;
    createChatSessionDto.tenantId = entity.tenantId;
    createChatSessionDto.sessionToken = entity.sessionToken;
    return createChatSessionDto;
  }
}
