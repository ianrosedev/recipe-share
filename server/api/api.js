import { Router } from 'express';
const router = Router();
import usersRouter from './users/router';
import recipesRouter from './recipes/router';
import reviewsRouter from './reviews/router';
import imagesRouter from './images/router';
import collectionsRouter from './collections/router';

router.use('/users', usersRouter);
router.use('/recipes', recipesRouter);
router.use('/reviews', reviewsRouter);
router.use('/images', imagesRouter);
router.use('/collections', collectionsRouter);

export default router;
