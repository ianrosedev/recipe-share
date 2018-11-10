import { Router } from 'express';
import controller from './authController';
import { verifyLoginEmail } from './auth';

const router = Router();

router.route('/login').post(verifyLoginEmail, controller.loginPost);
router.route('/requestPasswordReset').post(controller.requestPasswordReset);

export default router;
