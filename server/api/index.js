import { Router } from 'express';
import userRouter from './user';
import recipeRouter from './recipe';
import reviewRouter from './review';
import imageRouter from './image';
import collectionRouter from './collection';
import tagRouter from './tag';
import noteRouter from './note';

const router = Router();

router.use('/users', userRouter);
router.use('/recipes', recipeRouter);
router.use('/reviews', reviewRouter);
router.use('/images', imageRouter);
router.use('/collections', collectionRouter);
router.use('/tags', tagRouter);
router.use('/notes', noteRouter);

export default router;
