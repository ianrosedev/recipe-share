import { Router } from 'express';
const router = Router();
import controller from './reviewController';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/')
  .get(controller.reviewGetAll);

router.route('/:id')
  .get(controller.reviewGet)
  .put(checkToken, verifyUser, controller.reviewPut)
  .delete(checkToken, verifyUser, controller.reviewDelete);

export default router;
