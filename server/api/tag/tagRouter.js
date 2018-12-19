import { Router } from 'express';
import controller from './tagController';
import { checkToken } from '../../auth/auth';

const router = Router();

router.route('/')
  .get(controller.tagGetAll)
  .post(checkToken, controller.tagPost);

router.route('/:id')
  .get(controller.tagGet);

export default router;
