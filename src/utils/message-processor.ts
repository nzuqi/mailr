import { processQueuedMessages } from '../services';
import { logger } from './logger';

let intervalId: NodeJS.Timeout | null = null;
let isProcessing = false;

export const startMessageProcessor = () => {
  const interval = Number(process.env.MESSAGE_PROCESSING_INTERVAL || 1);

  intervalId = setInterval(
    async () => {
      if (isProcessing) {
        logger.warn('⏳ Message processor still running — skipping this tick.');
        return;
      }

      isProcessing = true;
      try {
        await processQueuedMessages();
      } catch (error) {
        logger.error('Error running message processor: ', error);
      } finally {
        isProcessing = false;
      }
    },
    interval * 60 * 1000,
  );
  logger.info(`⏱ Message processor running every ${interval} minute(s).`);
};

export const stopMessageProcessor = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('🛑 Message processor stopped.');
  }
};
