import { Router } from 'express';
import { createRole, deleteRole, getAllRoles, getRole, updateRole } from '../controllers';

export const roleRoutes = () => {
  const router = Router();

  router.post('/v1/roles', createRole);

  router.get('/v1/roles', getAllRoles);

  router.get('/v1/roles/:id', getRole);

  router.put('/v1/roles/:id', updateRole);

  router.delete('/v1/roles/:id', deleteRole);

  router.delete('/v1/roles', deleteRole);

  return router;
};
