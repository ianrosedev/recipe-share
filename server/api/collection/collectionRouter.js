import { Router } from 'express';
import controller from './collectionController';
import { checkToken, getUser } from '../../auth/auth';

const router = Router();

router.route('/')
  .get(controller.collectionGetAll)
  .post(checkToken, getUser, controller.collectionPost);

router.route('/:id')
  .get(controller.collectionGet)
  .put(checkToken, getUser, controller.collectionPut)
  .delete(checkToken, getUser, controller.collectionDelete);

export default router;
