import { Router } from 'express';
import controller from './collectionController';
import { checkToken, verifyUser } from '../../auth/auth';

const router = Router();

router
  .route('/')
  .get(controller.collectionGetAll)
  .post(checkToken, verifyUser, controller.collectionPost);

router
  .route('/:id')
  .get(controller.collectionGet)
  .put(checkToken, verifyUser, controller.collectionPut)
  .delete(checkToken, verifyUser, controller.collectionDelete);

export default router;
