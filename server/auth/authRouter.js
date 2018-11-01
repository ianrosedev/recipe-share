import { Router } from 'express';
const router = Router();
import controller from './authController';
import { verifyLoginEmail } from './auth';

router.route('/login')
  .post(verifyLoginEmail, controller.loginPost);

router.route('/requestPasswordReset')
  .post(controller.requestPasswordReset);

export default router;
