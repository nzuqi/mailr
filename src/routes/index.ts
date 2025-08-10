import { Router } from 'express';
import { roleRoutes } from './role.route';
import { userRoutes } from './user.route';

const router = Router();

router.use('/', roleRoutes());
router.use('/', userRoutes());

export default router;
