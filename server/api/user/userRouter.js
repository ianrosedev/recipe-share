import { Router } from 'express';
import controller from './userController';
import { checkToken, verifyUser } from '../../auth/auth';
import uploadImage from '../../middleware/multipartMiddleware';

const router = Router();

router.route('/')
  .post(controller.userPost)
  .put(checkToken, verifyUser, controller.userPut)
  .delete(checkToken, verifyUser, controller.userDelete);

router.route('/me')
  .get(checkToken, verifyUser, controller.userMeGet);

router.route('/:id')
  .get(controller.userGet);

router.route('/:id/recipes')
  .get(controller.userRecipesGet)
  .post(checkToken, verifyUser, controller.userRecipesPost);

router.route('/:id/reviews')
  .get(controller.userReviewsGet);

router.route('/:id/collections')
  .get(checkToken, verifyUser, controller.userCollectionsGet)
  .post(checkToken, verifyUser, controller.userCollectionsPost);

router.route('/:id/collections/public')
  .get(controller.userCollectionsGetAll);

router.route('/:id/images')
  .get(checkToken, verifyUser, controller.userImagesGet)
  .post(checkToken, verifyUser, uploadImage, controller.userImagesPost);

export default router;
