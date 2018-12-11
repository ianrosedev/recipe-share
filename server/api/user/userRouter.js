import { Router } from 'express';
import controller from './userController';
import { checkToken, getUser } from '../../auth/auth';
import uploadImage from '../../middleware/multipartMiddleware';

const router = Router();

router.route('/')
  .post(controller.userPost)
  .put(checkToken, getUser, controller.userPut)
  .delete(checkToken, getUser, controller.userDelete);

router.route('/me')
  .get(checkToken, getUser, controller.userMeGet);

router.route('/:id')
  .get(controller.userGet);

router.route('/:id/recipes')
  .get(controller.userRecipesGet)
  .post(checkToken, getUser, controller.userRecipesPost);

router.route('/:id/reviews')
  .get(controller.userReviewsGet);

router.route('/:id/collections')
  .get(checkToken, getUser, controller.userCollectionsGet)
  .post(checkToken, getUser, controller.userCollectionsPost);

router.route('/:id/collections/public')
  .get(controller.userCollectionsGetAll);

router.route('/:id/images')
  .get(checkToken, getUser, controller.userImagesGet)
  .post(checkToken, getUser, uploadImage, controller.userImagesPost);

export default router;
