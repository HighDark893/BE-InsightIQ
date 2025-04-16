import { ChatSession } from '../models/ChatSession';

enum Sender {
  User = 'User',
  Chatbot = 'Chatbot',
}

export default class Message {
  id: number;
  chatSession: ChatSession;
  content: string;
  sender: Sender;

  constructor(
    id: number,
    chatSession: ChatSession,
    content: string,
    sender: Sender,
  ) {
    this.id = id;
    this.chatSession = chatSession;
    this.content = content;
    this.sender = sender;
  }
}
