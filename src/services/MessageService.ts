import { MessageDto } from '../dto/message.dto';
import { CreateMessageDto } from '../dto/createMessage.dto';
import { MessageEntity } from '../entity/message.entity';
import { MessageRepository } from '../repository/message.repository';

export class MessageService {
  private readonly messageRepository = new MessageRepository();

  constructor() {}

  public async create(createMessageDto: CreateMessageDto): Promise<MessageDto> {
    const message = new MessageEntity();

    message.sender = createMessageDto.sender;
    message.content = createMessageDto.content;
    message.chatSessionId = createMessageDto.chatSessionId;

    return await this.messageRepository.save(message);
  }

  public async getAll(): Promise<MessageDto[]> {
    const messageEntities = await this.messageRepository.findAll();
    const messageDtos: MessageDto[] = [];

    messageEntities.forEach((m) => {
      messageDtos.push(MessageDto.fromEntity(m));
    });

    return messageDtos;
  }

  public async getById(id: number): Promise<MessageDto | null> {
    const messageEntity = await this.messageRepository.findById(id);

    if (!messageEntity) {
      return null;
    }
    return MessageDto.fromEntity(messageEntity);
  }

  public async getByChatSessionId(
    chatSessionId: number,
  ): Promise<MessageDto[]> {
    const messageEntities =
      await this.messageRepository.findByChatSessionId(chatSessionId);

    const messageDtos: MessageDto[] = [];

    messageEntities.forEach((m) => {
      messageDtos.push(MessageDto.fromEntity(m));
    });

    return messageDtos;
  }

  public async delete(id: number): Promise<Boolean> {
    const messageEntity = await this.messageRepository.findById(id);

    if (!messageEntity) {
      return false;
    }
    this.messageRepository.remove(messageEntity);
    return true;
  }
}
