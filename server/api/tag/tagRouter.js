import { Router } from 'express';
const router = Router();
import controller from './tagController';
import { checkToken } from '../../auth/auth';

router.route('/')
  .get(controller.tagGetAll)
  .post(checkToken, controller.tagPost);

router.route('/:id')
  .get(controller.tagGet);

export default router;
