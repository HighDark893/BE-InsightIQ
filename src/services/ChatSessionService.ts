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
    const chatSessionEntities = await this.chatSessionRepository.findAll();
    const chatSessionDtos: ChatSessionDto[] = [];

    chatSessionEntities.forEach((cs) => {
      chatSessionDtos.push(ChatSessionDto.fromEntity(cs));
    });

    return chatSessionDtos;
  }

  public async getById(id: number): Promise<ChatSessionDto | null> {
    const chatSessionEntity = await this.chatSessionRepository.findById(id);

    if (!chatSessionEntity) {
      return null;
    }
    return ChatSessionDto.fromEntity(chatSessionEntity);
  }

  public async delete(id: number): Promise<Boolean> {
    const chatSessionEntity = await this.chatSessionRepository.findById(id);

    if (!chatSessionEntity) {
      return false;
    }

    this.chatSessionRepository.remove(chatSessionEntity);
    return true;
  }
}
