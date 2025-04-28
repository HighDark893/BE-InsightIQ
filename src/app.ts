import express from 'express';
import bodyParser from 'body-parser';
import proxyController from "./controller/ProxyController";
import { LoggerMiddleware } from './middleware/LoggingMiddleware';
import { myDataSource } from './config/database.config';
import userController from './controller/user/UserController';
import documentCOntroller from './controller/DocumentController'; // <-- Dùng đường dẫn này

myDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!")
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err)
  })

const app = express();

app.use(bodyParser.json());
app.use(LoggerMiddleware.logRequest)
app.use(LoggerMiddleware.logResponseTime)
app.use('/proxy', proxyController);
app.use('/user', userController);
app.use('/documents', documentCOntroller); // <-- Gắn router vào '/documents'

export default app;
