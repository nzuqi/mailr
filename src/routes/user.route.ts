import { Router } from 'express';
import {
  registerUser,
  deleteUser,
  getAllUsers,
  getUser,
  signinUser,
  signoutUser,
  verifyEmailUser,
  resendVerificationUser,
  refreshTokenUser,
  beginTwoFactorSetup,
  verifyTwoFactorSetup,
  disableTwoFactor,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from '../controllers';
import { authenticate, loginLimiter, sensitiveLimiter } from '../utils';

export const userRoutes = () => {
  const router = Router();

  router.post('/v1/register', registerUser);

  router.post('/v1/signin', loginLimiter, signinUser);

  router.post('/v1/2fa/enable', authenticate(), sensitiveLimiter, beginTwoFactorSetup);

  router.post('/v1/2fa/verify', authenticate(), sensitiveLimiter, verifyTwoFactorSetup);

  router.post('/v1/2fa/disable', authenticate(), sensitiveLimiter, disableTwoFactor);

  router.post('/v1/signout', authenticate(), signoutUser);

  router.post('/v1/password/change', authenticate(), sensitiveLimiter, changePassword);

  router.post('/v1/password/forgot', sensitiveLimiter, requestPasswordReset);

  router.post('/v1/password/reset', sensitiveLimiter, resetPassword);

  router.get('/v1/users', authenticate(['ADMIN']), getAllUsers);

  router.get('/v1/users/:id', authenticate(), getUser);

  router.delete('/v1/users/:id', authenticate(['ADMIN']), deleteUser);

  router.delete('/v1/users', authenticate(['ADMIN']), deleteUser);

  router.post('/v1/verify-email', verifyEmailUser);

  router.post('/v1/resend-verification', resendVerificationUser);

  router.post('/v1/refresh-token', sensitiveLimiter, refreshTokenUser);

  return router;
};
