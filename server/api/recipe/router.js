import { Router } from 'express';
const router = Router();

router.route('/')
  .get(/* TODO */)
  .post(/* TODO */);

router.route('/:id')
  .get(/* TODO */)
  .put(/* TODO */)
  .delete(/* TODO */);

router.route('/:id/reviews')
  .get(/* TODO */)
  .post(/* TODO */);

router.route('/:id/images')
  .get(/* TODO */)
  .post(/* TODO */);

export default router;
