import { Rating } from '../constants/RatingEnum';

export class FeedbackDto {
  id: number;
  rating: Rating;
  comment: string;
  messageId: number;
  createdAt: string;
}
