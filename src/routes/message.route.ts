import { Router } from 'express';
import { getAllMessages, queueMessage } from '../controllers';
import { authenticate } from '../utils';

export const messageRoutes = () => {
  const router = Router();

  router.post('/v1/messages', authenticate(), queueMessage);

  router.get('/v1/messages', authenticate(), getAllMessages);

  return router;
};
