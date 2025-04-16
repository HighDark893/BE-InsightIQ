export default class ChatSessionDto {
  id: number;
  userChatbotId: number;
  tenantId: number;

  public constructor(id: number, userChatbotId: number, tenantId: number) {
    this.id = id;
    this.userChatbotId = userChatbotId;
    this.tenantId = tenantId;
  }
}
