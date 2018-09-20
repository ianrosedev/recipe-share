import { Router } from 'express';
const router = Router();
import controller from './collectionController';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/')
  .get(controller.collectionGetAll)
  .post(checkToken, verifyUser, controller.collectionPost)

router.route('/:id')
  .get(controller.collectionGet)
  .put(checkToken, verifyUser, controller.collectionPut)
  .delete(checkToken, verifyUser, controller.collectionDelete);

export default router;
