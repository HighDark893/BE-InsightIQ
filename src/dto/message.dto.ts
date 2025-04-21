import { Sender } from '../constants/SenderEnum';
import { MessageEntity } from '../entity/message.entity';

export class MessageDto {
  sender: Sender;
  content: string;
  createdAt: Date;

  public static fromEntity(entity: MessageEntity) {
    const messageDto = new MessageDto();

    messageDto.sender = entity.sender;
    messageDto.content = entity.content;
    messageDto.createdAt = entity.createdAt;

    return messageDto;
  }
}
