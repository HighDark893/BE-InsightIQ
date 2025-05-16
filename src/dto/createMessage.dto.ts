import { Sender } from '../constants/sender.enum';
import { MessageEntity } from '../entity/message.entity';

export class CreateMessageDto {
  sender: Sender;
  content: string;
  type: string;
  chatSessionId: number;

  public static fromEntity(entity: MessageEntity) {
    const messageDto = new CreateMessageDto();

    messageDto.sender = entity.sender;
    messageDto.content = entity.content;
    messageDto.type = entity.type;
    messageDto.chatSessionId = entity.chatSessionId;

    return messageDto;
  }
}
