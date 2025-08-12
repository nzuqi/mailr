import { Router } from 'express';
import { createRole, deleteRole, getAllRoles, getRole, updateRole } from '../controllers';
import { authenticate } from '../utils';

export const roleRoutes = () => {
  const router = Router();

  router.post('/v1/roles', authenticate(['ADMIN']), createRole);

  router.get('/v1/roles', authenticate(['ADMIN']), getAllRoles);

  router.get('/v1/roles/:id', authenticate(), getRole);

  router.put('/v1/roles/:id', authenticate(['ADMIN']), updateRole);

  router.delete('/v1/roles/:id', authenticate(['ADMIN']), deleteRole);

  router.delete('/v1/roles', authenticate(['ADMIN']), deleteRole);

  return router;
};
