import { ChatSessionEntity } from '../entity/chatSession.entity';

export class ChatSessionDto {
  id: number;
  session_token: string;

  public static fromEntity(entity: ChatSessionEntity) {
    const chatSessionDto = new ChatSessionDto();
    chatSessionDto.id = entity.id;
    chatSessionDto.session_token = entity.sessionToken;
    return chatSessionDto;
  }
}
