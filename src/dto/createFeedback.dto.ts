import { Rating } from '../constants/RatingEnum';

export class CreateFeedbackDto {
  rating: Rating;
  comment: string;
  messageId: number;
}
