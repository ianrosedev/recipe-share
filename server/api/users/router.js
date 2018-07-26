import { Router } from 'express';
const router = Router();

router.route('/')
  .post(/* TODO */);

router.route('/me')
  .get(/* TODO */);

router.route('/:id')
  .get(/* TODO */)
  .put(/* TODO */)
  .delete(/* TODO */);

router.route('/:id/recipes')
  .get(/* TODO */)
  .post(/* TODO */);

router.route('/:id/reviews')
  .get(/* TODO */);

router.route('/:id/collections')
  .get(/* TODO */)
  .post(/* TODO */);

router.route('/:id/images')
  .get( /* TODO */)
  .post(/* TODO */);

export default router;
