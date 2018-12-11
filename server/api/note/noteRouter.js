import { Router } from 'express';
import controller from './noteController';
import { checkToken, getUser } from '../../auth/auth';

const router = Router();

router.route('/:id')
  .get(checkToken, getUser, controller.noteGet)
  .post(checkToken, getUser, controller.notePost)
  .put(checkToken, getUser, controller.notePut)
  .delete(checkToken, getUser, controller.noteDelete);

export default router;
