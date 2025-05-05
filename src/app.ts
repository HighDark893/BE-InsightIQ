import express from 'express';
import bodyParser from 'body-parser';
import proxyController from './controller/ProxyController';
import { LoggerMiddleware } from './middleware/logging.middleware';
import { dataSource } from './config/database.config';
import userController from './controller/UserController';
import superAdminController from './controller/SuperAdminController';
import tenantController from './controller/TenantController';
import authController from './controller/AuthController';
import cookieParser from 'cookie-parser';
import messageController from './controller/MessageController';
import chatSessionController from './controller/ChatSessionController';
import userChatbotController from './controller/UserChatbotController';
import feedbackController from './controller/FeedbackController';
import documentController from './controller/DocumentController';

dataSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(LoggerMiddleware.logRequest);
app.use(LoggerMiddleware.logResponseTime);
app.use('/proxy', proxyController);
app.use('/user', userController);
app.use('/superadmin', superAdminController);
app.use('/user_chatbot', userChatbotController);
app.use('/tenant', tenantController);
app.use('/auth', authController);
app.use('/message', messageController);
app.use('/chat_session', chatSessionController);
app.use('/feedback', feedbackController);
app.use('/documents', documentController);

export default app;
