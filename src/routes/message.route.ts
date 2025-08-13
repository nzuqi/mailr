import { Router } from 'express';
import { queueMessage } from '../controllers';
import { authenticate } from '../utils';

export const messageRoutes = () => {
  const router = Router();

  router.post('/v1/messages', authenticate(), queueMessage);

  return router;
};
