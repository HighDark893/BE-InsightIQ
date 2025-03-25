import express from 'express';
import bodyParser from 'body-parser';
import proxyController from "./controller/ProxyController";
import { LoggerMiddleware } from './middleware/LoggingMiddleware';


const app = express();

app.use(bodyParser.json());
app.use(LoggerMiddleware.logRequest)
app.use(LoggerMiddleware.logResponseTime)
app.use('/proxy', proxyController);

export default app;
