import { Router } from 'express';
const router = Router();

router.route('/login')
  .get(/* TODO */);

router.route('/logout')
  .post(/* TODO */);

router.route('/requestPasswordReset')
  .post(/* TODO */);

export default router;
