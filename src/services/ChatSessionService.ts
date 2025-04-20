import { ChatSessionDto } from '../dto/chatSession.dto';
import { ChatSessionEntity } from '../entity/chatSession.entity';
import { ChatSessionRepository } from '../repository/chatSession.repository';

export class ChatSessionService {
  private readonly chatSessionRepository = new ChatSessionRepository();

  constructor() {}

  public async create(
    userChatbotId: number,
    tenantId: number,
    sessionToken: string,
  ): Promise<ChatSessionDto> {
    const chatSession = new ChatSessionEntity();
    chatSession.userChatbotId = userChatbotId;
    chatSession.tenantId = tenantId;
    chatSession.sessionToken = sessionToken;

    return this.chatSessionRepository.save(chatSession);
  }
}
