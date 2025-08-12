import { Router } from 'express';
import { registerUser, deleteUser, getAllUsers, getUser, signinUser, signoutUser, verifyEmailUser, resendVerificationUser } from '../controllers';
import { authenticate } from '../utils';

export const userRoutes = () => {
  const router = Router();

  router.post('/v1/register', registerUser);

  router.post('/v1/signin', signinUser);

  router.post('/v1/signout', authenticate(), signoutUser);

  router.get('/v1/users', authenticate(['ADMIN']), getAllUsers);

  router.get('/v1/users/:id', authenticate(), getUser);

  router.delete('/v1/users/:id', authenticate(['ADMIN']), deleteUser);

  router.delete('/v1/users', authenticate(['ADMIN']), deleteUser);

  router.post('/v1/verify-email', verifyEmailUser);

  router.post('/v1/resend-verification', resendVerificationUser);

  return router;
};
