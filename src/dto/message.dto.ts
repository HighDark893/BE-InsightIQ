import { Sender } from '../constants/sender.enum';
import { MessageEntity } from '../entity/message.entity';

export class MessageDto {
  id: number;
  sender: Sender;
  content: string;
  chatSessionId: number;
  createdAt: string;

  public static fromEntity(entity: MessageEntity) {
    const messageDto = new MessageDto();

    messageDto.id = entity.id;
    messageDto.sender = entity.sender;
    messageDto.content = entity.content;
    messageDto.chatSessionId = entity.chatSessionId;
    messageDto.createdAt =
      entity.createdAt.toTimeString() + entity.createdAt.toDateString();

    return messageDto;
  }
}
