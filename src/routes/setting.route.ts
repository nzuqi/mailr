import { Router } from 'express';
import { getAllSettings, updateSettings } from '../controllers';

export const settingRoutes = () => {
  const router = Router();

  router.get('/v1/settings', getAllSettings);

  router.put('/v1/settings', updateSettings);

  return router;
};
