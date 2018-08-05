import { Router } from 'express';
const router = Router();
import controller from './controller';
import { verifyLoginEmail } from './auth';

router.route('/login')
  .post(verifyLoginEmail(), controller.login);

router.route('/logout')
  .post(/* TODO */);

router.route('/requestPasswordReset')
  .post(/* TODO */);

export default router;
