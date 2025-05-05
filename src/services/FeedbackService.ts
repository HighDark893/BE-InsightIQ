import { FeedbackDto } from '../dto/feedback.dto';
import { CreateFeedbackDto } from '../dto/createFeedback.dto';
import { FeedbackEntity } from '../entity/feedback.entity';
import { FeedbackRepository } from '../repository/feedback.repository';
import { TenantRepository } from '../repository/tenant.repository';
import { RatingCountDto } from '../dto/ratingCount.dto';
import { ChatSessionRepository } from '../repository/chatSession.repository';
import { MessageRepository } from '../repository/message.repository';

export class FeedbackService {
  private readonly feedbackRepository = new FeedbackRepository();
  private readonly tenantRepository = new TenantRepository();
  private readonly chatSessionRepository = new ChatSessionRepository();
  private readonly messagesRepository = new MessageRepository();

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

    await this.feedbackRepository.remove(feedbackEntity);
    return true;
  }

  public async countRatingByTenantId(tenantId: number) {
    const tenantEntity = await this.tenantRepository.getTenantById(tenantId);

    if (!tenantEntity) {
      return null;
    }

    const chatSessions =
      await this.chatSessionRepository.findByTenantId(tenantId);

    let positiveRatingCount = 0;
    let negativeRatingCount = 0;

    for (const cs of chatSessions) {
      const messages = await this.messagesRepository.findByChatSessionId(cs.id);

      for (const m of messages) {
        const feedback = await this.feedbackRepository.findByMessageId(m.id);

        if (!feedback) {
          continue;
        }

        if (feedback.rating === 'Positive') {
          positiveRatingCount++;
        } else if (feedback.rating === 'Negative') {
          negativeRatingCount++;
        }
      }
    }

    const ratingCount = new RatingCountDto();

    ratingCount.positive = positiveRatingCount;
    ratingCount.negative = negativeRatingCount;

    return ratingCount;
  }

  public async getFeedbacksByTenantId(tenantId: number) {
    const tenantEntity = await this.tenantRepository.getTenantById(tenantId);

    if (!tenantEntity) {
      return null;
    }

    const feedbacks: FeedbackDto[] = [];

    const chatSessions =
      await this.chatSessionRepository.findByTenantId(tenantId);

    for (const cs of chatSessions) {
      const messages = await this.messagesRepository.findByChatSessionId(cs.id);

      for (const m of messages) {
        const feedback = await this.feedbackRepository.findByMessageId(m.id);

        if (!feedback) {
          continue;
        }

        const feedbackDto = new FeedbackDto();

        feedbackDto.id = feedback.id;
        feedbackDto.rating = feedback.rating;
        feedbackDto.comment = feedback.comment;
        feedbackDto.messageId = feedback.messageId;
        feedbackDto.createdAt =
          feedback.createdAt.toTimeString() + feedback.createdAt.toDateString();

        feedbacks.push(feedbackDto);
      }
    }

    return feedbacks;
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
