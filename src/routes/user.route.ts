import { Router } from 'express';
import { createUser, deleteUser, getAllUsers, getUser } from '../controllers';

export const userRoutes = () => {
  const router = Router();

  router.post('/v1/users', createUser);

  router.get('/v1/users', getAllUsers);

  router.get('/v1/users/:id', getUser);

  router.delete('/v1/users/:id', deleteUser);

  router.delete('/v1/users', deleteUser);

  return router;
};
