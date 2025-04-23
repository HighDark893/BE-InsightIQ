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

    return this.mapFeedbackEntityToDto(savedFeedbackEntity);
  }

  public async getAll(): Promise<FeedbackDto[]> {
    const feedbackEntities = await this.feedbackRepository.findAll();
    const feedbackDtos: FeedbackDto[] = [];

    feedbackEntities.forEach((f) => {
      feedbackDtos.push(this.mapFeedbackEntityToDto(f));
    });

    return feedbackDtos;
  }

  public async getById(id: number): Promise<FeedbackDto | null> {
    const feedbackEntity = await this.feedbackRepository.findById(id);

    if (!feedbackEntity) {
      return null;
    }

    return this.mapFeedbackEntityToDto(feedbackEntity);
  }

  public async delete(id: number): Promise<Boolean> {
    const feedbackEntity = await this.feedbackRepository.findById(id);

    if (!feedbackEntity) {
      return false;
    }

    this.feedbackRepository.remove(feedbackEntity);
    return true;
  }

  private mapFeedbackEntityToDto(entity: FeedbackEntity): FeedbackDto {
    const feedbackDto = new FeedbackDto();

    feedbackDto.id = entity.id;
    feedbackDto.rating = entity.rating;
    feedbackDto.comment = entity.comment;
    feedbackDto.messageId = entity.messageId;
    feedbackDto.createdAt =
      entity.createdAt.toTimeString() + entity.createdAt.toDateString();

    return feedbackDto;
  }
}
