import { Router } from 'express';
const router = Router();
import controller from './controller';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/')
  .post(controller.userCreate)
  .put(checkToken(), verifyUser(), controller.userUpdate)
  .delete(checkToken(), verifyUser(), controller.userDestroy);

router.route('/me')
  .get(checkToken(), verifyUser(), controller.userMeRead);

router.route('/:id')
  .get(controller.userIdRead);

router.route('/:id/recipes')
  .get(/* TODO */);

router.route('/:id/reviews')
  .get(/* TODO */);

router.route('/:id/collections')
  .get(/* TODO */);

router.route('/:id/images')
  .get( /* TODO */);

export default router;
