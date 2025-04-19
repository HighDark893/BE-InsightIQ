enum Rating {
  Positive = 1,
  Negative = 0,
}

export default class Feedback {
  id: number;
  chatSessionId: number;
  rating: Rating;
  comment: string;
  createAt: Date;

  constructor(
    id: number,
    chatSessionId: number,
    rating: Rating,
    comment: string,
  ) {
    this.id = id;
    this.chatSessionId = chatSessionId;
    this.rating = rating;
    this.comment = comment;
    this.createAt = new Date();
  }
}
