import { Router } from 'express';
import { roleRoutes } from './role.route';
import { userRoutes } from './user.route';
import { settingRoutes } from './setting.route';
import { applicationRoutes } from './application.route';
import { messageRoutes } from './message.route';

const router = Router();

router.use('/', roleRoutes());
router.use('/', userRoutes());
router.use('/', settingRoutes());
router.use('/', applicationRoutes());
router.use('/', messageRoutes());

export default router;
