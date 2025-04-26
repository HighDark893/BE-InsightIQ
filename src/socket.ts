// src/socket.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import crypto from 'crypto';

// Import Winston types for explicit typing
import { Logger as WinstonLogger } from 'winston';

// Import necessary local services, DTOs, and utilities
import { Logger } from './utils/Logger'; // Adjust path if needed
import { MessageService } from './services/MessageService';
import { ChatSessionService } from './services/ChatSessionService';
import { ChatbotService } from './services/ChatbotService'; // <--- Import ChatbotService
import { CreateMessageDto } from './dto/createMessage.dto';
import { Sender } from './constants/SenderEnum';
import { CreateChatSessionDto } from './dto/createChatSession.dto';

// Instantiate services needed within socket logic
const logger: WinstonLogger = Logger.getInstance(); // Use explicit type
const messageService = new MessageService();
const chatSessionService = new ChatSessionService();
const chatbotService = new ChatbotService(); // <--- Instantiate ChatbotService

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

        try {
          // --- Input Validation ---
          if (!messageData.text || !messageData.tenantId) {
            logger.warn('Received invalid message data', messageData);
            socket.emit('error', {
              message: 'Missing message text or tenant ID.',
            });
            return;
          }

          // --- Session Handling (Revised & Corrected) ---
          let currentSessionId: number | null = messageData.sessionId ?? null;
          let sessionToken: string | null = messageData.sessionToken ?? null;
          let tenantId: number = messageData.tenantId;

          // Placeholder: Logic to find session by token
          // if (!currentSessionId && sessionToken) { ... }

          // If no valid session ID exists yet, create one
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

          // --- CRITICAL CHECK ---
          if (typeof currentSessionId !== 'number') {
            logger.error(
              `Failed to obtain a valid numeric session ID for tenant ${tenantId}. Aborting message save.`,
            );
            socket.emit('error', {
              message: 'Failed to establish a valid chat session.',
            });
            return;
          }

          logger.info(`Proceeding with session ID: ${currentSessionId}`);

          // Store session on socket data if not already there
          if (!socket.data.sessionId) {
            socket.data.sessionId = currentSessionId;
            socket.data.tenantId = tenantId;
          }
          // --- End Session Handling ---

          // --- Save User Message ---
          const userMessage = new CreateMessageDto();
          userMessage.chatSessionId = currentSessionId; // Guaranteed to be a number
          userMessage.content = messageData.text;
          userMessage.sender = Sender.User;
          await messageService.create(userMessage);
          logger.info(`User message saved for session ${currentSessionId}`);

          // --- Generate Bot Response using ChatbotService --- // <--- CHANGE AREA ---
          logger.info(
            `Calling ChatbotService.generateResponse for session ${currentSessionId}`,
          );
          const botResponseContent = await chatbotService.generateResponse(
            messageData.text,
            currentSessionId,
            tenantId,
          );
          logger.info(
            `ChatbotService returned response for session ${currentSessionId}`,
          );
          // --- End CHANGE AREA ---

          // --- Save Bot Message ---
          const botMessage = new CreateMessageDto();
          botMessage.chatSessionId = currentSessionId; // Guaranteed to be a number
          botMessage.content = botResponseContent; // <--- Use the actual response
          botMessage.sender = Sender.ChatBot;
          const savedBotMessage = await messageService.create(botMessage);
          logger.info(`Bot message saved for session ${currentSessionId}`);

          // --- Send Response to Client ---
          io.to(socket.id).emit('newMessage', {
            id: savedBotMessage.id,
            sender: savedBotMessage.sender,
            content: savedBotMessage.content, // <--- Send the actual response
            createdAt: savedBotMessage.createdAt,
          });
          logger.info(
            `Sent chatbot response to socket ${socket.id} for session ${currentSessionId}`,
          );
        } catch (error) {
          logger.error(
            `Error handling message for socket ${socket.id}:`,
            error,
          );
          socket.emit('error', {
            message:
              'An internal server error occurred while processing your message.',
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
