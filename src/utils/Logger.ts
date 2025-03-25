// src/utils/Logger.ts
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export class Logger {
  private static instance: WinstonLogger;

  private constructor() {}

  public static getInstance(): WinstonLogger {
    if (!Logger.instance) {
      Logger.instance = createLogger({
        level: 'info',
        format: format.combine(
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
        ),
        transports: [
          new transports.Console(),
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' }),
        ],
      });
    }
    return Logger.instance;
  }
}