import { Router } from 'express';
const router = Router();
import controller from './recipeController';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/')
  .get(controller.recipeGetAll)
  .post(checkToken, verifyUser, controller.recipePost);

router.route('/:id')
  .get(controller.recipeGet)
  .put(checkToken, verifyUser, controller.recipePut)
  .delete(checkToken, verifyUser, controller.recipeDelete);

router.route('/:id/reviews')
  .get(controller.recipeReviewsGet)
  .post(checkToken, verifyUser, controller.recipeReviewsPost);

router.route('/:id/images')
  .get(/* TODO */)
  .post(/* TODO */);

export default router;
