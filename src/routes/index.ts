import { Router } from 'express';
import { roleRoutes } from './role.route';
import { userRoutes } from './user.route';
import { settingRoutes } from './setting.route';
import { applicationRoutes } from './application.route';
import { messageRoutes } from './message.route';
import { dashboardRoutes } from './dashboard.route';

const router = Router();

router.use('/', roleRoutes());
router.use('/', userRoutes());
router.use('/', settingRoutes());
router.use('/', applicationRoutes());
router.use('/', messageRoutes());
router.use('/', dashboardRoutes());

export default router;
