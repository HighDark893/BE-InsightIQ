// src/socket.ts
// --- IMPORTS ---
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import crypto from 'crypto';
import { Logger as WinstonLogger } from 'winston';

// Local imports
import { Logger } from './utils/Logger';
import { MessageService } from './services/MessageService';
import { ChatSessionService } from './services/ChatSessionService';
import { ChatbotService } from './services/ChatbotService';
import { CreateMessageDto } from './dto/createMessage.dto';
import { Sender } from './constants/sender.enum';
import { CreateChatSessionDto } from './dto/createChatSession.dto';
// Import the new DTOs/Interfaces if needed for type checking (optional here)
import { ProductDataDto } from './dto/ProductData.dto';
import { ProductComparisonDataDto } from './dto/ProductComparisonData.dto';
import { ProductPromotionDataDto } from './dto/ProductPromotionData.dto';
// Define possible response types from ChatbotService
enum ResponseType {
  TEXT = 'text',
  INFO = 'productInfo',
  COMPARE = 'productComparison',
  PROMO = 'productPromotion',
}

// Instantiate services
const logger: WinstonLogger = Logger.getInstance();
const messageService = new MessageService();
const chatSessionService = new ChatSessionService();
const chatbotService = new ChatbotService();

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  logger.info('Setting up Socket.IO server...');

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Adjust for production!
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join', (data) => {
      logger.info(`Socket ${socket.id} joined with data:`, data);
      // Add join logic if needed
    });

    // Handle receiving messages
    socket.on(
      'sendMessage',
      async (messageData: {
        text: string;
        sessionId?: number;
        tenantId: number;
        sessionToken?: string;
      }) => {
        logger.info(`Message received from ${socket.id}:`, messageData);

        let currentSessionId: number | null = null;
        let tenantId: number = messageData.tenantId;

        try {
          // --- Input Validation ---
          if (!messageData.text || typeof messageData.tenantId !== 'number') {
            // Check tenantId type
            logger.warn('Received invalid message data', messageData);
            socket.emit('error', {
              message: 'Missing message text or invalid tenant ID.',
            });
            return;
          }
          tenantId = messageData.tenantId; // Assign validated tenantId

          // --- Session Handling (remains the same) ---
          currentSessionId = messageData.sessionId ?? null;
          let sessionToken: string | null = messageData.sessionToken ?? null;

          // Placeholder: Logic to find session by token
          // if (!currentSessionId && sessionToken) { ... }

          if (!currentSessionId) {
            logger.info(
              `No valid session ID found/provided, creating new session for tenant ${tenantId}`,
            );
            const newSessionDto = new CreateChatSessionDto();
            sessionToken = crypto.randomBytes(32).toString('hex');
            newSessionDto.tenantId = tenantId;
            newSessionDto.userChatbotId = 0; // Adjust if needed
            newSessionDto.sessionToken = sessionToken;

            const createdSession =
              await chatSessionService.create(newSessionDto);
            if (!createdSession || !createdSession.id) {
              throw new Error(
                'Failed to create a new chat session or retrieve its ID.',
              );
            }
            currentSessionId = createdSession.id;
            logger.info(
              `Created new session: ${currentSessionId} with token ${sessionToken}`,
            );
            socket.emit('sessionDetails', {
              sessionId: currentSessionId,
              sessionToken: sessionToken,
            });
          }

          if (typeof currentSessionId !== 'number') {
            throw new Error(
              `Failed to obtain a valid numeric session ID for tenant ${tenantId}.`,
            );
          }

          logger.info(`Proceeding with session ID: ${currentSessionId}`);

          if (!socket.data.sessionId) {
            socket.data.sessionId = currentSessionId;
            socket.data.tenantId = tenantId;
          }
          // --- End Session Handling ---

          // --- Save User Message (remains the same) ---
          const userMessage = new CreateMessageDto();
          userMessage.chatSessionId = currentSessionId;
          userMessage.content = messageData.text;
          userMessage.sender = Sender.User;
          await messageService.create(userMessage);
          logger.info(`User message saved for session ${currentSessionId}`);

          // --- Generate Bot Response (Object with type and potentially structured content) ---
          logger.info(
            `Calling ChatbotService.generateResponse for session ${currentSessionId}`,
          );
          const botResponse: {
            type: ResponseType;
            content:
              | string
              | ProductDataDto
              | ProductComparisonDataDto
              | ProductPromotionDataDto;
          } = await chatbotService.generateResponse(
            messageData.text,
            currentSessionId,
            tenantId,
          );
          logger.info(
            `ChatbotService returned response type '${botResponse.type}' for session ${currentSessionId}`,
          );

          // --- Prepare Bot Message for Saving (Convert structured content to string) ---
          const botMessageToSave = new CreateMessageDto();
          botMessageToSave.chatSessionId = currentSessionId;
          botMessageToSave.sender = Sender.ChatBot;

          let contentForDb: string;
          if (typeof botResponse.content === 'string') {
            contentForDb = botResponse.content;
          } else {
            // Create a simple text summary or stringify the JSON for the DB record
            // Option 1: Stringify (can be long)
            // contentForDb = JSON.stringify(botResponse.content);
            // Option 2: Simple Summary (better for DB readability)
            switch (botResponse.type) {
              case ResponseType.INFO:
                contentForDb = `[Thông tin sản phẩm: ${(botResponse.content as ProductDataDto).name || 'N/A'}]`;
                break;
              case ResponseType.COMPARE:
                const productNames = (
                  botResponse.content as ProductComparisonDataDto
                ).products
                  .map((p) => p.name)
                  .join(', ');
                contentForDb = `[So sánh sản phẩm: ${productNames || 'N/A'}]`;
                break;
              case ResponseType.PROMO:
                contentForDb = `[Thông tin khuyến mãi: ${(botResponse.content as ProductPromotionDataDto).promotionName || (botResponse.content as ProductPromotionDataDto).promotionDescription?.substring(0, 30) + '...' || 'N/A'}]`;
                break;
              default:
                contentForDb = '[Nội dung có cấu trúc không xác định]';
            }
            logger.info(`Generated summary for DB: ${contentForDb}`);
          }
          botMessageToSave.content = contentForDb; // Save the string representation

          await messageService.create(botMessageToSave);
          logger.info(
            `Bot message (summary/text) saved for session ${currentSessionId}`,
          );

          // --- Send Structured Response (including object content) to Client ---
          const messageToSend = {
            sender: 'bot',
            type: botResponse.type, // Send the original type ('productInfo', 'text', etc.)
            content: botResponse.content, // Send the original content (string OR object)
            timestamp: new Date().toISOString(),
            // Add message ID from saved bot message if needed by frontend for feedback
            // id: savedBotMessage.id // Assuming messageService.create returns the saved DTO with ID
          };
          io.to(socket.id).emit('newMessage', messageToSend);
          logger.info(
            `Sent response (type: '${botResponse.type}') to socket ${socket.id} for session ${currentSessionId}`,
          );
        } catch (error) {
          logger.error(
            `Error handling message for socket ${socket.id}, session ${currentSessionId ?? 'UNKNOWN'}:`,
            error,
          );
          io.to(socket.id).emit('newMessage', {
            sender: 'bot',
            type: ResponseType.TEXT, // Send TEXT type for errors
            content:
              'Tôi xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.',
            timestamp: new Date().toISOString(),
          });
        }
      },
    );

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO setup complete.');
  return io;
}
