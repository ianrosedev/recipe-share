import { Router } from 'express';
const router = Router();
import userRouter from './user/router';
import recipeRouter from './recipe/router';
import reviewRouter from './review/router';
import imageRouter from './image/router';
import collectionRouter from './collection/router';
import noteRouter from './note/router';

router.use('/users', userRouter);
router.use('/recipes', recipeRouter);
router.use('/reviews', reviewRouter);
router.use('/images', imageRouter);
router.use('/collections', collectionRouter);
router.use('/notes', noteRouter);

export default router;
