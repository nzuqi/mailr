import { Router } from 'express';
import { getAllSettings, updateSettings } from '../controllers';
import { authenticate } from '../utils';

export const settingRoutes = () => {
  const router = Router();

  router.get('/v1/settings', authenticate(), getAllSettings);

  router.put('/v1/settings', authenticate(['ADMIN']), updateSettings);

  return router;
};
