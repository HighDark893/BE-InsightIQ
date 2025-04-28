import { Rating } from '../constants/rating.enum';

export class FeedbackDto {
  id: number;
  rating: Rating;
  comment: string;
  messageId: number;
  createdAt: string;
}
