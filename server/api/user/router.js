import { Router } from 'express';
const router = Router();

router.route('/')
  .post(/* TODO */)
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
