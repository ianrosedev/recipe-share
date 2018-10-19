import { Router } from 'express';
const router = Router();
import controller from './noteController';
import { checkToken, verifyUser } from '../../auth/auth';

router.route('/:id')
  .get(checkToken, verifyUser, controller.noteGet)
  .post(checkToken, verifyUser, controller.notePost)
  .put(checkToken, verifyUser, controller.notePut)
  .delete(checkToken, verifyUser, controller.noteDelete);

export default router;
