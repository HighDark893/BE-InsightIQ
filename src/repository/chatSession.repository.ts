import { ChatSessionEntity } from '../entity/chatSession.entity';
import { myDataSource } from '../config/database.config';
import { ChatSessionDto } from '../dto/chatSession.dto';

export class ChatSessionRepository {
  private readonly chatSessionRepository =
    myDataSource.getRepository(ChatSessionEntity);

  public async save(chatSession: ChatSessionEntity): Promise<ChatSessionDto> {
    return ChatSessionDto.fromEntity(
      await this.chatSessionRepository.save(chatSession),
    );
  }

  public async findAll(): Promise<ChatSessionDto[]> {
    const chatSessionEntities = await this.chatSessionRepository.find();
    const chatSessionDtos: ChatSessionDto[] = [];

    chatSessionEntities.forEach((cs) => {
      const chatSessionDto = new ChatSessionDto();

      chatSessionDto.id = cs.id;
      chatSessionDto.userChatbotId = cs.userChatbotId;
      chatSessionDto.tenantId = cs.tenantId;
      chatSessionDto.sessionToken = cs.sessionToken;

      chatSessionDtos.push(chatSessionDto);
    });

    return chatSessionDtos;
  }

  public async findById(id: number): Promise<ChatSessionDto | null> {
    const foundChatSessionEntity = await this.chatSessionRepository.findOne({
      where: { id: id },
    });

    if (!foundChatSessionEntity) {
      return null;
    }

    return ChatSessionDto.fromEntity(foundChatSessionEntity);
  }
}
