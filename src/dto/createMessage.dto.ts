import { Sender } from '../constants/SenderEnum';
import { MessageEntity } from '../entity/message.entity';

export class CreateMessageDto {
  sender: Sender;
  content: string;
  chatSessionId: number;

  public static fromEntity(entity: MessageEntity) {
    const messageDto = new CreateMessageDto();

    messageDto.sender = entity.sender;
    messageDto.content = entity.content;
    messageDto.chatSessionId = entity.chatSessionId;

    return messageDto;
  }
}
