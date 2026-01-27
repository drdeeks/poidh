import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${message}`;
    if (Object.keys(meta).length > 0 && meta.stack === undefined) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console output with colors
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File output for persistent logs
    new winston.transports.File({
      filename: path.join(logsDir, 'bot.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Export convenience methods
export const log = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, meta?: object) => logger.error(message, meta),
  debug: (message: string, meta?: object) => logger.debug(message, meta),

  // Special log for autonomous actions
  autonomous: (action: string, details: object) => {
    logger.info(`🤖 AUTONOMOUS ACTION: ${action}`, { autonomous: true, ...details });
  },

  // Transaction logs
  tx: (action: string, txHash: string, details?: object) => {
    logger.info(`💸 TX: ${action}`, { txHash, ...details });
  },

  // Bounty lifecycle logs
  bounty: (action: string, bountyId: string, details?: object) => {
    logger.info(`🎯 BOUNTY [${bountyId}]: ${action}`, details);
  },

  // Winner selection logs
  winner: (bountyId: string, winner: string, rationale: string) => {
    logger.info(`🏆 WINNER SELECTED for bounty ${bountyId}`, { winner, rationale });
  },
};
