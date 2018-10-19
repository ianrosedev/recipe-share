import Review from './reviewModel';
import User from '../user/userModel';
import Recipe from '../recipe/recipeModel';
import { validateQuery, findAndSort } from '../../helpers/query';

const reviewGet = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(400).json({ message: 'No review with that id!' });
      return;
    }

    res.json({ review });
  }
  catch (err) {
    next(err);
  }
};

const reviewGetAll = async (req, res, next) => {
  try {
    // Make sure only permitted operations are sent to query
    const query = validateQuery(req.query, [
      'createdAt',
      'rating',
      'stars',
      'limit',
      'offset'
    ]);

    if (!query) {
      res.status(400).send({ message: 'Bad request!' });
      return;
    }

    findAndSort(req, res, next, {
      model: Review,
      as: 'reviews',
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const reviewPut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const reviewId = req.params.id;
    const reviewToUpdate = await Review.findById(reviewId).select('userId');

    if (!userId.equals(reviewToUpdate.userId)) {
      res
        .status(400)
        .json({ message: 'Not authorized to update this review!' });
      return;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedReview);
  }
  catch (err) {
    next(err);
  }
};

const reviewDelete = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const reviewId = req.params.id;
    const reviewToDestroy = await Review
      .findById(reviewId)
      .select('userId recipeId');

    if (!reviewToDestroy) {
      res.status(400).json({ message: 'No review with that id' });
      return;
    }

    if (!userId.equals(reviewToDestroy.userId)) {
      res.status(400).json({ message: 'Not authorized to delete this review!' });
      return;
    }

    const destroyedReview = await reviewToDestroy.remove();

    if (!destroyedReview) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { reviews: reviewId } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      reviewToDestroy.recipeId,
      { $pull: { reviews: reviewId } },
      { new: true }
    );

    if (!updatedRecipe) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({
      user: updatedUser,
      recipe: updatedRecipe,
      review: destroyedReview._id
    });
  }
  catch (err) {
    next(err);
  }
};

export default {
  reviewGet,
  reviewGetAll,
  reviewPut,
  reviewDelete
};
