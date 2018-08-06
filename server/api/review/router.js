import { Router } from 'express';
const router = Router();
import controller from './controller';

router.route('/')
  .get(controller.reviewRead);

router.route('/:id')
  .get(/* TODO */)
  .put(/* TODO */)
  .delete(/* TODO */);

export default router;
