import { Router } from 'express';
import { getDashboard } from '../controllers';
import { authenticate } from '../utils';

export const dashboardRoutes = () => {
  const router = Router();

  router.get('/v1/dashboard', authenticate(), getDashboard);
  return router;
};
