import { Rating } from '../constants/rating.enum';

export class CreateFeedbackDto {
  rating: Rating;
  comment: string;
  messageId: number;
}
