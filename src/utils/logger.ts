import { createLogger, format, transports } from 'winston';

const { colorize, combine, printf, timestamp } = format;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logFormat = printf(({ level, message, timestamp }: any) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    // Console logs (colorized in dev)
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),

    // Write to file only in production
    ...(process.env.NODE_ENV === 'production'
      ? [new transports.File({ filename: 'logs/error.log', level: 'error' }), new transports.File({ filename: 'logs/combined.log' })]
      : []),
  ],
});
