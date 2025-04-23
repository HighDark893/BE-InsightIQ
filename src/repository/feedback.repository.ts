import { myDataSource } from '../config/database.config';
import { FeedbackDto } from '../dto/feedback.dto';
import { FeedbackEntity } from '../entity/feedback.entity';

export class FeedbackRepository {
  private readonly feedbackRepository =
    myDataSource.getRepository(FeedbackEntity);

  public async save(feedback: FeedbackEntity): Promise<FeedbackEntity> {
    return await this.feedbackRepository.save(feedback);
  }
}
