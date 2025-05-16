enum Sender {
  User = 'User',
  Chatbot = 'Chatbot',
}

export default class Message {
  id: number;
  chatSessionId: number;
  content: string;
  sender: Sender;
  createAt: Date;

  constructor(
    id: number,
    chatSessionId: number,
    content: string,
    sender: Sender,
  ) {
    this.id = id;
    this.chatSessionId = chatSessionId;
    this.content = content;
    this.sender = sender;
    this.createAt = new Date();
  }
}
