class ChatSession {
    id: number;
    userChatbotId: number;
    tenantId: number;
    sessionToken: string;
    createdAt: Date;

    public constructor(
        id: number,
        userChatbotId: number,
        tenantId: number,
        sessionToken: string,
    ) {
        this.id = id;
        this.userChatbotId = userChatbotId;
        this.tenantId = tenantId;
        this.sessionToken = sessionToken;
        this.createdAt = new Date();
    }
}