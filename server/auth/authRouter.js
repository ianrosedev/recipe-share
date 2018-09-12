import { Router } from 'express';
const router = Router();
import controller from './authController';
import { verifyLoginEmail } from './auth';

router.route('/login')
  .post(verifyLoginEmail, controller.loginPost);

router.route('/logout')
  .post(/* TODO */);

router.route('/requestPasswordReset')
  .post(/* TODO */);

export default router;
