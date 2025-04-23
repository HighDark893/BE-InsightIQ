import { FeedbackDto } from '../dto/feedback.dto';
import { CreateFeedbackDto } from '../dto/createFeedback.dto';
import { FeedbackEntity } from '../entity/feedback.entity';
import { FeedbackRepository } from '../repository/feedback.repository';

export class FeedbackService {
  private readonly feedbackRepository = new FeedbackRepository();

  public async create(
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<FeedbackDto> {
    const feedbackEntity = new FeedbackEntity();

    feedbackEntity.rating = createFeedbackDto.rating;
    feedbackEntity.comment = createFeedbackDto.comment;
    feedbackEntity.messageId = createFeedbackDto.messageId;

    const savedFeedbackEntity =
      await this.feedbackRepository.save(feedbackEntity);
    const feedbackDto = new FeedbackDto();

    feedbackDto.id = savedFeedbackEntity.id;
    feedbackDto.rating = savedFeedbackEntity.rating;
    feedbackDto.comment = savedFeedbackEntity.comment;
    feedbackDto.messageId = savedFeedbackEntity.messageId;
    feedbackDto.createdAt =
      savedFeedbackEntity.createdAt.toTimeString() +
      savedFeedbackEntity.createdAt.toDateString();

    return feedbackDto;
  }
}
