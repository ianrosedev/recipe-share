import { Router } from 'express';
const router = Router();
import controller from './controller';

router.route('/')
  .post(controller.createUser)
  .put(/* TODO */)
  .delete(/* TODO */);

router.route('/me')
  .get(/* TODO */);

router.route('/:id')
  .get(/* TODO */);

router.route('/:id/recipes')
  .get(/* TODO */);

router.route('/:id/reviews')
  .get(/* TODO */);

router.route('/:id/collections')
  .get(/* TODO */);

router.route('/:id/images')
  .get( /* TODO */);

export default router;
