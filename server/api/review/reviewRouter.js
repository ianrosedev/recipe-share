import { Router } from 'express';
import controller from './reviewController';
import { checkToken, verifyUser } from '../../auth/auth';

const router = Router();

router.route('/')
  .get(controller.reviewGetAll);

router.route('/:id')
  .get(controller.reviewGet)
  .put(checkToken, verifyUser, controller.reviewPut)
  .delete(checkToken, verifyUser, controller.reviewDelete);

export default router;
