import { Router } from 'express';
import {
  createApplication,
  deleteApplication,
  generateApplicationKey,
  getAllApplications,
  getApplication,
  updateApplication,
  updateApplicationSmtp,
} from '../controllers';
import { authenticate } from '../utils';

export const applicationRoutes = () => {
  const router = Router();

  router.post('/v1/applications', authenticate(), createApplication);

  router.get('/v1/applications', authenticate(['ADMIN']), getAllApplications);

  router.get('/v1/applications/:id', authenticate(), getApplication);

  router.put('/v1/applications/:id', authenticate(['ADMIN']), updateApplication);

  router.put('/v1/applications/:id/smtp', authenticate(['ADMIN']), updateApplicationSmtp);

  router.delete('/v1/applications/:id', authenticate(['ADMIN']), deleteApplication);

  router.delete('/v1/applications', authenticate(['ADMIN']), deleteApplication);

  router.post('/v1/generate-key/:id', authenticate(), generateApplicationKey);

  return router;
};
