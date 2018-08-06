import { Router } from 'express';
const router = Router();
import controller from './controller';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/')
  .get(controller.recipeRead)
  .post(checkToken(), verifyUser(), controller.recipeCreate);

router.route('/:id')
  .get(controller.recipeIdRead)
  .put(checkToken(), verifyUser(), controller.recipeIdUpdate)
  .delete(checkToken(), verifyUser(), controller.recipeIdDestroy);

router.route('/:id/reviews')
  .get(/* TODO */)
  .post(checkToken(), verifyUser(), controller.recipeIdReviewCreate);

router.route('/:id/images')
  .get(/* TODO */)
  .post(/* TODO */);

export default router;
