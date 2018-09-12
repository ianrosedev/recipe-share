import { Router } from 'express';
const router = Router();
import controller from './userController';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/')
  .post(controller.userPost)
  .put(checkToken, verifyUser, controller.userPut)
  .delete(checkToken, verifyUser, controller.userDelete);

router.route('/me')
  .get(checkToken, verifyUser, controller.userMeGet);

router.route('/:id')
  .get(controller.userGet);

router.route('/:id/recipes')
  .get(controller.userRecipesGet);

router.route('/:id/reviews')
  .get(controller.userReviewsGet);

router.route('/:id/collections')
  .get(/* TODO */);

router.route('/:id/images')
  .get( /* TODO */);

export default router;
