import { dataSource } from '../config/database.config';
import { FeedbackEntity } from '../entity/feedback.entity';

export class FeedbackRepository {
  private readonly feedbackRepository =
    dataSource.getRepository(FeedbackEntity);

  public async save(feedback: FeedbackEntity): Promise<FeedbackEntity> {
    return await this.feedbackRepository.save(feedback);
  }

  public async findAll(): Promise<FeedbackEntity[]> {
    return await this.feedbackRepository.find();
  }

  public async findById(id: number): Promise<FeedbackEntity | null> {
    return await this.feedbackRepository.findOne({
      where: { id: id },
    });
  }

  public async findByMessageId(messageId: number): Promise<FeedbackEntity | null> {
    return await this.feedbackRepository.findOne({
      where: { messageId: messageId },
    });
  }

  public async remove(feedback: FeedbackEntity): Promise<FeedbackEntity> {
    return await this.feedbackRepository.remove(feedback);
  }
}
