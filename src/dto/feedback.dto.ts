import { Rating } from '../constants/rating.enum';

export class FeedbackDto {
  id: number;
  rating: string;
  comment: string;
  messageId: number;
  createdAt: string;
}
