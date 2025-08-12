import { Router } from 'express';
import { registerUser, deleteUser, getAllUsers, getUser, signinUser, signoutUser, verifyEmailUser, resendVerificationUser } from '../controllers';

export const userRoutes = () => {
  const router = Router();

  router.post('/v1/register', registerUser);

  router.post('/v1/signin', signinUser);

  router.post('/v1/signout', signoutUser);

  router.get('/v1/users', getAllUsers);

  router.get('/v1/users/:id', getUser);

  router.delete('/v1/users/:id', deleteUser);

  router.delete('/v1/users', deleteUser);

  router.post("/v1/verify-email", verifyEmailUser);

  router.post("/v1/resend-verification", resendVerificationUser);

  return router;
};
