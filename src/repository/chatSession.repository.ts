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
}
