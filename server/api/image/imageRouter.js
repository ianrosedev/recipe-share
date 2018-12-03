import { Router } from 'express';
import controller from './imageController';
import { checkToken, verifyUser } from '../../auth/auth';
import uploadImage from '../../middleware/multipartMiddleware';

const router = Router();

router.route('/')
  .post(checkToken, verifyUser, uploadImage, controller.imagePost);

router.route('/:id')
  .get(controller.imageGet)
  .delete(checkToken, verifyUser, controller.imageDelete);

export default router;
