import { Router } from 'express';
import controller from './recipeController';
import { checkToken, verifyUser } from '../../auth/auth';
import uploadImage from '../../middleware/multipartMiddleware';

const router = Router();

router.route('/')
  .get(controller.recipeGetAll)
  .post(checkToken, verifyUser, controller.recipePost);

router.route('/:id')
  .get(controller.recipeGet)
  .put(checkToken, verifyUser, controller.recipePut);

router.route('/:id/reviews')
  .get(controller.recipeReviewsGet)
  .post(checkToken, verifyUser, controller.recipeReviewsPost);

router.route('/:id/images')
  .get(controller.recipeImagesGet)
  .post(checkToken, verifyUser, uploadImage, controller.recipeImagesPost);

router.route('/:id/notes')
  .get(checkToken, verifyUser, controller.recipeNotesGet)
  .post(checkToken, verifyUser, controller.recipeNotesPost)
  .put(checkToken, verifyUser, controller.recipeNotesPut)
  .delete(checkToken, verifyUser, controller.recipeNotesDelete);

export default router;
