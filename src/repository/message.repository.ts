import { myDataSource } from '../config/database.config';
import { MessageDto } from '../dto/message.dto';
import { MessageEntity } from '../entity/message.entity';

export class MessageRepository {
  private readonly messageRepository =
    myDataSource.getRepository(MessageEntity);

  public async save(message: MessageEntity): Promise<MessageDto> {
    return MessageDto.fromEntity(await this.messageRepository.save(message));
  }

  public async findAll(): Promise<MessageEntity[]> {
    return await this.messageRepository.find();
  }

  public async findById(id: number): Promise<MessageEntity | null> {
    return await this.messageRepository.findOne({
      where: { id: id },
    });
  }

  public async findByChatSessionId(
    chatSessionId: number,
  ): Promise<MessageEntity[]> {
    return await this.messageRepository.find({
      where: { chatSessionId: chatSessionId },
    });
  }

  public async remove(message: MessageEntity): Promise<MessageEntity> {
    return await this.messageRepository.remove(message);
  }
}
