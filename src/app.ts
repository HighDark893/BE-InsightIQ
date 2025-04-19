import express from 'express';
import bodyParser from 'body-parser';
import proxyController from "./controller/ProxyController";
import { LoggerMiddleware } from './middleware/LoggingMiddleware';
import { myDataSource } from './config/database.config';

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

export default app;
