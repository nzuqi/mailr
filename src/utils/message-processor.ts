import { processQueuedMessages } from '../services';
import { logger } from './logger';

let intervalId: NodeJS.Timeout | null = null;

export const startMessageProcessor = () => {
  const interval = Number(process.env.MESSAGE_PROCESSING_INTERVAL || 1);

  intervalId = setInterval(processQueuedMessages, interval * 60 * 1000);
  logger.info(`⏱ Message processor running every ${interval} minute(s).`);
};

export const stopMessageProcessor = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('🛑 Message processor stopped.');
  }
};
