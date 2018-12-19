import { Router } from 'express';
import controller from './reviewController';
import { checkToken, getUser } from '../../auth/auth';

const router = Router();

router.route('/')
  .get(controller.reviewGetAll);

router.route('/:id')
  .get(controller.reviewGet)
  .put(checkToken, getUser, controller.reviewPut)
  .delete(checkToken, getUser, controller.reviewDelete);

export default router;
