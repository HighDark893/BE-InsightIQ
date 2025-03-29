enum Sender {
  User = 'User',
  Chatbot = 'Chatbot',
}

export default class Message {
  id: number;
  userChatbotId: number;
  tenantId: number;
  sender: Sender;
  createAt: Date;

  constructor(
    id: number,
    userChatbotId: number,
    tenantId: number,
    sender: Sender,
  ) {
    this.id = id;
    this.userChatbotId = userChatbotId;
    this.tenantId = tenantId;
    this.sender = sender;
    this.createAt = new Date();
  }
}
