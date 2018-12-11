import { Router } from 'express';
import controller from './imageController';
import { checkToken, getUser } from '../../auth/auth';
import uploadImage from '../../middleware/multipartMiddleware';

const router = Router();

router.route('/')
  .post(checkToken, getUser, uploadImage, controller.imagePost);

router.route('/:id')
  .get(controller.imageGet)
  .delete(checkToken, getUser, controller.imageDelete);

export default router;
