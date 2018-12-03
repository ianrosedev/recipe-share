import { Router } from 'express';
import controller from './noteController';
import { checkToken, verifyUser } from '../../auth/auth';

const router = Router();

router.route('/:id')
  .get(checkToken, verifyUser, controller.noteGet)
  .post(checkToken, verifyUser, controller.notePost)
  .put(checkToken, verifyUser, controller.notePut)
  .delete(checkToken, verifyUser, controller.noteDelete);

export default router;
