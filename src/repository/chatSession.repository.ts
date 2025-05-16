import { ChatSessionEntity } from '../entity/chatSession.entity';
import { dataSource } from '../config/database.config';
import { ChatSessionDto } from '../dto/chatSession.dto';

export class ChatSessionRepository {
  private readonly chatSessionRepository =
    dataSource.getRepository(ChatSessionEntity);

  public async save(chatSession: ChatSessionEntity): Promise<ChatSessionDto> {
    return ChatSessionDto.fromEntity(
      await this.chatSessionRepository.save(chatSession),
    );
  }

  public async findAll(): Promise<ChatSessionEntity[]> {
    return await this.chatSessionRepository.find();
  }

  public async findById(id: number): Promise<ChatSessionEntity | null> {
    return await this.chatSessionRepository.findOne({
      where: { id: id },
    });
  }

  public async findByTenantId(tenantId: number): Promise<ChatSessionEntity[]> {
    return await this.chatSessionRepository.find({
      where: { tenantId: tenantId },
    });
  }

  public async remove(entity: ChatSessionEntity): Promise<ChatSessionEntity> {
    return await this.chatSessionRepository.remove(entity);
  }
}
