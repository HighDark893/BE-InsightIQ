import express from 'express';
import bodyParser from 'body-parser';
import proxyController from "./controller/ProxyController";
import { LoggerMiddleware } from './middleware/LoggingMiddleware';
import { dataSource } from './config/database.config';
import userController from './controller/user/UserController';
import superAdminController from './controller/user/SuperAdminController';
import tenantController from './controller/user/TenantController';

dataSource
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
app.use('/superadmin', superAdminController);
app.use('/tenant', tenantController);

export default app;
