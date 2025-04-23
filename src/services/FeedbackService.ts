import { FeedbackDto } from '../dto/feedback.dto';
import { CreateFeedbackDto } from '../dto/createFeedback.dto';
import { FeedbackEntity } from '../entity/feedback.entity';
import { FeedbackRepository } from '../repository/feedback.repository';

export class FeedbackService {
  private readonly feedbackRepository = new FeedbackRepository();

  public async create(
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<FeedbackEntity> {
    const feedbackEntity = new FeedbackEntity();

    feedbackEntity.rating = createFeedbackDto.rating;
    feedbackEntity.comment = createFeedbackDto.comment;
    feedbackEntity.messageId = createFeedbackDto.messageId;

    return await this.feedbackRepository.save(feedbackEntity);
  }
}
