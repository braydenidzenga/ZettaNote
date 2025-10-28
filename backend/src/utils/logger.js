/**
 * Logger Utility
 * Works in test mode (no errors), and in dev/prod normally.
 */

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

let logger; // <-- we'll assign it based on environment

// ✅ 1. Skip full setup when testing
if (process.env.NODE_ENV === "test") {
  logger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    http: () => {},
    success: () => {},
    request: () => {},
    db: () => {},
    auth: () => {},
  };
} else {
  // ✅ 2. Real logger for dev/prod
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  const logColors = {
    error: "red",
    warn: "yellow",
    info: "cyan",
    http: "magenta",
    debug: "white",
  };

  winston.addColors(logColors);

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `[${timestamp}] ${level}: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += `\n${JSON.stringify(metadata, null, 2)}`;
      }
      return msg;
    })
  );

  const transports = [
    new winston.transports.Console({ format: consoleFormat }),
  ];

  if (process.env.NODE_ENV === "production") {
    const logsDir = path.join(__dirname, "../../logs");
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        format: logFormat,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        format: logFormat,
      })
    );
  }

  const winstonLogger = winston.createLogger({
    levels: logLevels,
    level:
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === "production" ? "info" : "debug"),
    transports,
    exitOnError: false,
  });

  class Logger {
    error(message, error = null) {
      if (error instanceof Error) {
        winstonLogger.error(message, { error: error.message, stack: error.stack });
      } else if (error) {
        winstonLogger.error(message, { details: error });
      } else {
        winstonLogger.error(message);
      }
    }
    warn(message, metadata = null) {
      metadata ? winstonLogger.warn(message, metadata) : winstonLogger.warn(message);
    }
    info(message, metadata = null) {
      metadata ? winstonLogger.info(message, metadata) : winstonLogger.info(message);
    }
    debug(message, metadata = null) {
      metadata ? winstonLogger.debug(message, metadata) : winstonLogger.debug(message);
    }
    http(message, metadata = null) {
      metadata ? winstonLogger.http(message, metadata) : winstonLogger.http(message);
    }
    success(message, metadata = null) {
      winstonLogger.info(`✅ ${message}`, metadata);
    }
    request(req) {
      this.http(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
    }
    db(operation, collection, metadata = null) {
      this.debug(`DB ${operation}: ${collection}`, metadata);
    }
    auth(event, user, metadata = null) {
      this.info(`Auth ${event}: ${user}`, metadata);
    }
  }

  logger = new Logger();
}

// ✅ Always export once (top-level)
export default logger;
