import { Router } from 'express';
import { roleRoutes } from './role.route';
import { userRoutes } from './user.route';
import { settingRoutes } from './setting.route';

const router = Router();

router.use('/', roleRoutes());
router.use('/', userRoutes());
router.use('/', settingRoutes());

export default router;
