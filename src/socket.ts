// src/socket.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import crypto from 'crypto';

// Import Winston types for explicit typing
import { Logger as WinstonLogger } from 'winston';

// Import necessary local services, DTOs, and utilities
import { Logger } from './utils/Logger'; // Adjust path if needed
import { MessageService } from './services/MessageService'; // [cite: 7]
import { ChatSessionService } from './services/ChatSessionService'; // [cite: 9]
import { ChatbotService } from './services/ChatbotService';
import { CreateMessageDto } from './dto/createMessage.dto'; // [cite: 56]
import { Sender } from './constants/SenderEnum'; // [cite: 32]
import { CreateChatSessionDto } from './dto/createChatSession.dto'; // [cite: 50]

// Instantiate services needed within socket logic
const logger: WinstonLogger = Logger.getInstance(); // [cite: 30] Use explicit type
const messageService = new MessageService(); // [cite: 7]
const chatSessionService = new ChatSessionService(); // [cite: 9]
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

        let currentSessionId: number | null = null; // Declare here to ensure scope
        let tenantId: number = messageData.tenantId; // Ensure tenantId has scope

        try {
          // Wrap session handling and message processing
          // --- Input Validation ---
          if (!messageData.text || !messageData.tenantId) {
            logger.warn('Received invalid message data', messageData);
            socket.emit('error', {
              message: 'Missing message text or tenant ID.',
            });
            return;
          }

          // --- Session Handling ---
          currentSessionId = messageData.sessionId ?? null;
          let sessionToken: string | null = messageData.sessionToken ?? null;
          tenantId = messageData.tenantId;

          // Placeholder: Logic to find session by token
          // if (!currentSessionId && sessionToken) { ... }

          // If no valid session ID exists yet, create one
          if (!currentSessionId) {
            logger.info(
              `No valid session ID found/provided, creating new session for tenant ${tenantId}`,
            );
            const newSessionDto = new CreateChatSessionDto(); // [cite: 50]
            sessionToken = crypto.randomBytes(32).toString('hex');
            newSessionDto.tenantId = tenantId;
            newSessionDto.userChatbotId = 0; // Adjust if needed
            newSessionDto.sessionToken = sessionToken;

            const createdSession =
              await chatSessionService.create(newSessionDto); // [cite: 9]
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

          // --- CRITICAL CHECK ---
          if (typeof currentSessionId !== 'number') {
            // Throw error instead of returning, so main catch block handles it
            throw new Error(
              `Failed to obtain a valid numeric session ID for tenant ${tenantId}.`,
            );
          }

          logger.info(`Proceeding with session ID: ${currentSessionId}`);

          // Store session on socket data if not already there
          if (!socket.data.sessionId) {
            socket.data.sessionId = currentSessionId;
            socket.data.tenantId = tenantId;
          }
          // --- End Session Handling ---

          // --- Save User Message ---
          const userMessage = new CreateMessageDto(); // [cite: 56]
          userMessage.chatSessionId = currentSessionId;
          userMessage.content = messageData.text;
          userMessage.sender = Sender.User; // [cite: 32]
          await messageService.create(userMessage); // [cite: 7]
          logger.info(`User message saved for session ${currentSessionId}`);

          // --- Generate Bot Response (Object with type hint) ---
          logger.info(
            `Calling ChatbotService.generateResponse for session ${currentSessionId}`,
          );
          const botResponse: { type: string; content: string } =
            await chatbotService.generateResponse(
              messageData.text,
              currentSessionId,
              tenantId,
            );
          logger.info(
            `ChatbotService returned response type '${botResponse.type}' for session ${currentSessionId}`,
          );

          // --- Save Bot Message (Save only the text content) ---
          const botMessageToSave = new CreateMessageDto(); // [cite: 56]
          botMessageToSave.chatSessionId = currentSessionId;
          botMessageToSave.content = botResponse.content; // Save plain text content
          botMessageToSave.sender = Sender.ChatBot; // [cite: 32]
          await messageService.create(botMessageToSave); // [cite: 7]
          logger.info(
            `Bot message (text content) saved for session ${currentSessionId}`,
          );

          // --- Send Structured Hint Response to Client ---
          const messageToSend = {
            sender: 'bot',
            type: botResponse.type,
            content: botResponse.content,
            timestamp: new Date().toISOString(),
          };
          io.to(socket.id).emit('newMessage', messageToSend);
          logger.info(
            `Sent hinted response ('${botResponse.type}') to socket ${socket.id} for session ${currentSessionId}`,
          );
        } catch (error) {
          // Catch errors during session handling, message saving, or generation
          logger.error(
            `Error handling message for socket ${socket.id}, session ${currentSessionId ?? 'UNKNOWN'}:`,
            error,
          );
          // Send a generic text error back to the client
          io.to(socket.id).emit('newMessage', {
            sender: 'bot',
            type: 'text',
            content:
              'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
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
