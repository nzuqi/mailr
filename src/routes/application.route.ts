import { Router } from 'express';
import { createApplication, deleteApplication, getAllApplications, getApplication, updateApplication } from '../controllers';

export const applicationRoutes = () => {
  const router = Router();

  router.post('/v1/applications', createApplication);

  router.get('/v1/applications', getAllApplications);

  router.get('/v1/applications/:id', getApplication);

  router.put('/v1/applications/:id', updateApplication);

  router.delete('/v1/applications/:id', deleteApplication);

  router.delete('/v1/applications', deleteApplication);

  return router;
};
