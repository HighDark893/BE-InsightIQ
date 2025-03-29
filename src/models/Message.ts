enum Sender {
  User = 'User',
  Chatbot = 'Chatbot',
}

export default class Message {
  id: number;
  userChatbotId: number;
  tenantId: number;
  content: string;
  sender: Sender;
  createAt: Date;

  constructor(
    id: number,
    userChatbotId: number,
    tenantId: number,
    content: string,
    sender: Sender,
  ) {
    this.id = id;
    this.userChatbotId = userChatbotId;
    this.tenantId = tenantId;
    this.content = content;
    this.sender = sender;
    this.createAt = new Date();
  }
}
