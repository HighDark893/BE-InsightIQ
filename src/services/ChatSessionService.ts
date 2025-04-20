import { ChatSessionDto } from '../dto/chatSession.dto';
import { CreateChatSessionDto } from '../dto/createChatSession.dto';
import { ChatSessionEntity } from '../entity/chatSession.entity';
import { ChatSessionRepository } from '../repository/chatSession.repository';

export class ChatSessionService {
  private readonly chatSessionRepository = new ChatSessionRepository();

  constructor() {}

  public async create(
    createChatSessionDto: CreateChatSessionDto,
  ): Promise<ChatSessionDto> {
    const chatSession = new ChatSessionEntity();
    chatSession.userChatbotId = createChatSessionDto.userChatbotId;
    chatSession.tenantId = createChatSessionDto.tenantId;
    chatSession.sessionToken = createChatSessionDto.sessionToken;

    return this.chatSessionRepository.save(chatSession);
  }

  public async getAll(): Promise<ChatSessionDto[]> {
    return this.chatSessionRepository.findAll();
  }

  public async getById(id: number): Promise<ChatSessionDto | null> {
    return this.chatSessionRepository.findById(id);
  }
}
