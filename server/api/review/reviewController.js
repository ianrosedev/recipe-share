import Review from './reviewModel';
import User from '../user/userModel';
import Recipe from '../recipe/recipeModel';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';
import { validateQuery, findAndSort } from '../../helpers/query';

const reviewGet = asyncMiddleware(async (req, res, next) => {
  const reviewId = req.params.id;
  const review = await Review.findById(reviewId);

  if (!review) {
    errorResponse.searchNotFound('review')
  }

  res.json(dataResponse({ review }));
});

const reviewGetAll = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, [
    'createdAt',
    'rating',
    'stars',
    'limit',
    'offset'
  ]);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: Review,
    as: 'reviews',
    query
  });
});

const reviewPut = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const reviewId = req.params.id;
  const reviewToUpdate = await Review.findById(reviewId).select('userId');

  if (!userId.equals(reviewToUpdate.userId)) {
    errorResponse.unauthorized();
  }

  const updatedReview = await Review.findByIdAndUpdate(
    reviewId,
    { $set: req.body },
    { new: true }
  );

  res.json(dataResponse(updatedReview));
});

const reviewDelete = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const reviewId = req.params.id;
  const reviewToDestroy = await Review
    .findById(reviewId)
    .select('userId recipeId');

  if (!reviewToDestroy) {
    errorResponse.searchNotFound('review');
  }

  if (!userId.equals(reviewToDestroy.userId)) {
    errorResponse.unauthorized();
  }

  const destroyedReview = await reviewToDestroy.remove();

  if (!destroyedReview) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { reviews: reviewId } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
    return;
  }

  const updatedRecipe = await Recipe.findByIdAndUpdate(
    reviewToDestroy.recipeId,
    { $pull: { reviews: reviewId } },
    { new: true }
  );

  if (!updatedRecipe) {
    errorResponse.serverError();
    return;
  }

  res.json(dataResponse({
    user: updatedUser,
    recipe: updatedRecipe,
    review: destroyedReview._id
  }));
});

export default {
  reviewGet,
  reviewGetAll,
  reviewPut,
  reviewDelete
};
