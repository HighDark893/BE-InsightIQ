import { myDataSource } from '../config/database.config';
import { FeedbackDto } from '../dto/feedback.dto';
import { FeedbackEntity } from '../entity/feedback.entity';

export class FeedbackRepository {
  private readonly feedbackRepository =
    myDataSource.getRepository(FeedbackEntity);

  public async save(feedback: FeedbackEntity): Promise<FeedbackDto> {
    const feedbackDto = new FeedbackDto();

    feedbackDto.id = feedback.id;
    feedbackDto.rating = feedback.rating;
    feedbackDto.comment = feedback.comment;
    feedbackDto.messageId = feedback.messageId;
    feedbackDto.createdAt =
      feedback.createdAt.toTimeString() + feedback.createdAt.toDateString();

    return feedbackDto;
  }
}
