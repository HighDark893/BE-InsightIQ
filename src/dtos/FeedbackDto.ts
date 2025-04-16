import { ChatSession } from '../models/ChatSession';

enum Rating {
  Positive = 1,
  Negative = 0,
}

export default class Feedback {
  id: number;
  chatSession: ChatSession;
  rating: Rating;
  comment: string;

  constructor(
    id: number,
    chatSession: ChatSession,
    rating: Rating,
    comment: string,
  ) {
    this.id = id;
    this.chatSession = chatSession;
    this.rating = rating;
    this.comment = comment;
  }
}
