
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

export class LoggerMiddleware {
  private static logger = Logger.getInstance();

  public static logRequest(req: Request, res: Response, next: NextFunction): void {
    const { method, url, body } = req;
    LoggerMiddleware.logger.info(`Incoming Request: ${method} ${url} - Body: ${JSON.stringify(body)}`);
    next();
  }

  public static logResponseTime(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime();
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = (seconds * 1e3 + nanoseconds * 1e-6).toFixed(2);
      LoggerMiddleware.logger.info(`Request to ${req.url} took ${duration} ms`);
    });
    next();
  }
}