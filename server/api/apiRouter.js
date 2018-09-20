import { Router } from 'express';
const router = Router();
import userRouter from './user/userRouter';
import recipeRouter from './recipe/recipeRouter';
import reviewRouter from './review/reviewRouter';
import imageRouter from './image/imageRouter';
import collectionRouter from './collection/collectionRouter';
import tagRouter from './tag/tagRouter';
import noteRouter from './note/noteRouter';

router.use('/users', userRouter);
router.use('/recipes', recipeRouter);
router.use('/reviews', reviewRouter);
router.use('/images', imageRouter);
router.use('/collections', collectionRouter);
router.use('/tags', tagRouter);
router.use('/notes', noteRouter);

export default router;
