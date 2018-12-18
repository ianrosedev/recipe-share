import { Router } from 'express';
import controller from './recipeController';
import { checkToken, getUser } from '../../auth/auth';
import { uploadImage } from '../../middleware/multipartMiddleware';

const router = Router();

router.route('/')
  .get(controller.recipeGetAll)
  .post(checkToken, getUser, controller.recipePost);

router.route('/:id')
  .get(controller.recipeGet)
  .put(checkToken, getUser, controller.recipePut);

router.route('/:id/reviews')
  .get(controller.recipeReviewsGet)
  .post(checkToken, getUser, controller.recipeReviewsPost);

router.route('/:id/images')
  .get(controller.recipeImagesGet)
  .post(checkToken, getUser, uploadImage, controller.recipeImagesPost);

router.route('/:id/notes')
  .get(checkToken, getUser, controller.recipeNotesGet)
  .post(checkToken, getUser, controller.recipeNotesPost)
  .put(checkToken, getUser, controller.recipeNotesPut)
  .delete(checkToken, getUser, controller.recipeNotesDelete);

export default router;
