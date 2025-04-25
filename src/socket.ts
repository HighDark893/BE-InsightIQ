// src/socket.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'; // Import HttpServer type
import crypto from 'crypto'; // Import crypto for generating session tokens
import { Logger } from './utils/Logger'; // Assuming socket.ts is in src/
import { MessageService } from './services/MessageService'; //
import { ChatSessionService } from './services/ChatSessionService'; //
// import { ChatbotService } from './services/ChatbotService'; // Import when Phase 2 is ready
import { CreateMessageDto } from './dto/createMessage.dto'; //
import { Sender } from './constants/SenderEnum'; //
import { CreateChatSessionDto } from './dto/createChatSession.dto'; //

// Instantiate services needed within socket logic
// Consider using Dependency Injection later for better management
const logger = Logger.getInstance(); //
const messageService = new MessageService(); //
const chatSessionService = new ChatSessionService(); //
// const chatbotService = new ChatbotService(); // Uncomment when Phase 2 is ready

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

    // Optional: Handle user joining/initialization
    socket.on('join', (data) => {
      logger.info(`Socket ${socket.id} joined with data:`, data);
      // Example: data might contain { tenantId: 1 }
      // Store tenantId if provided on join
      // if (data.tenantId) {
      //    socket.data.tenantId = data.tenantId;
      // }
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

          // Placeholder: Logic to find session by token if ID is missing but token exists
          // This requires implementing findByToken in ChatSessionService/Repository
          // if (!currentSessionId && sessionToken) {
          //     const foundSession = await chatSessionService.findByToken(sessionToken, tenantId);
          //     if (foundSession) {
          //         currentSessionId = foundSession.id;
          //         logger.info(`Found existing session ${currentSessionId} via token`);
          //     } else {
          //         logger.warn(`Invalid session token provided: ${sessionToken}, proceeding to create new session.`);
          //         sessionToken = null; // Clear invalid token
          //     }
          // }

          // If no valid session ID exists yet, create one
          if (!currentSessionId) {
            logger.info(
              `No valid session ID found/provided, creating new session for tenant ${tenantId}`,
            );
            const newSessionDto = new CreateChatSessionDto(); //
            sessionToken = crypto.randomBytes(32).toString('hex'); // Generate new token
            newSessionDto.tenantId = tenantId;
            // Assign a default/placeholder user ID or implement user lookup if needed
            newSessionDto.userChatbotId = 0; // Example placeholder
            newSessionDto.sessionToken = sessionToken;

            const createdSession =
              await chatSessionService.create(newSessionDto); //
            if (!createdSession || !createdSession.id) {
              throw new Error(
                'Failed to create a new chat session or retrieve its ID.',
              );
            }
            currentSessionId = createdSession.id; // Assign the new ID
            logger.info(
              `Created new session: ${currentSessionId} with token ${sessionToken}`,
            );
            // Send the new session details back to the client
            socket.emit('sessionDetails', {
              sessionId: currentSessionId,
              sessionToken: sessionToken,
            });
          }

          // --- CRITICAL CHECK ---
          // Ensure we have a valid number ID before proceeding
          if (typeof currentSessionId !== 'number') {
            logger.error(
              `Failed to obtain a valid numeric session ID for tenant ${tenantId}. Aborting message save.`,
            );
            socket.emit('error', {
              message: 'Failed to establish a valid chat session.',
            });
            return; // Stop processing if we couldn't get a session ID
          }

          logger.info(`Proceeding with session ID: ${currentSessionId}`);

          // Store session info on the socket object itself for potential future use within this connection
          if (!socket.data.sessionId) {
            socket.data.sessionId = currentSessionId;
            socket.data.tenantId = tenantId;
          }
          // --- End Session Handling ---

          // --- Save User Message ---
          const userMessage = new CreateMessageDto(); //
          userMessage.chatSessionId = currentSessionId; // Now guaranteed to be a number
          userMessage.content = messageData.text;
          userMessage.sender = Sender.User; //
          await messageService.create(userMessage); //
          logger.info(`User message saved for session ${currentSessionId}`);

          // --- Generate Bot Response (Phase 2 placeholder) ---
          // Uncomment and use when ChatbotService is ready
          // const botResponseContent = await chatbotService.generateResponse(
          //    messageData.text,
          //    currentSessionId,
          //    tenantId
          // );
          const botResponseContent = `Received: "${messageData.text}". LangChain response pending implementation.`; // Placeholder for now

          // --- Save Bot Message ---
          const botMessage = new CreateMessageDto(); //
          botMessage.chatSessionId = currentSessionId; // Now guaranteed to be a number
          botMessage.content = botResponseContent;
          botMessage.sender = Sender.ChatBot; //
          const savedBotMessage = await messageService.create(botMessage); //
          logger.info(`Bot message saved for session ${currentSessionId}`);

          // --- Send Response to Client ---
          // Use io.to(socket.id).emit(...) to send ONLY to the sender
          io.to(socket.id).emit('newMessage', {
            id: savedBotMessage.id, // Include message ID from saved entity
            sender: savedBotMessage.sender,
            content: savedBotMessage.content,
            createdAt: savedBotMessage.createdAt, // Include timestamp from saved entity
            // chatSessionId: savedBotMessage.chatSessionId // Optional: include session ID
          });
          logger.info(
            `Sent placeholder response to socket ${socket.id} for session ${currentSessionId}`,
          );
        } catch (error) {
          logger.error(
            `Error handling message for socket ${socket.id}:`,
            error,
          );
          // Avoid sending detailed internal errors to the client
          socket.emit('error', {
            message:
              'An internal server error occurred while processing your message.',
          });
        }
      },
    );

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}. Reason: ${reason}`);
      // Handle cleanup if needed (e.g., update session status in DB)
    });

    // Optional: Handle other errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO setup complete.');
  return io; // Return the io instance if needed elsewhere
}
