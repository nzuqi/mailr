import { Router } from 'express';
import { getAllMessages, getMessage, getMessageAttribution, queueMessage } from '../controllers';
import { authenticate } from '../utils';

export const messageRoutes = () => {
  const router = Router();

  router.post('/v1/messages', queueMessage);

  router.get('/v1/messages', authenticate(), getAllMessages);

  router.get('/v1/messages/:id', authenticate(), getMessage);

  router.get('/v1/messages/:id/attribution', authenticate(['ADMIN']), getMessageAttribution);

  return router;
};
