import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Recipe from './recipeModel';
import User from '../user/userModel';
import Review from '../review/reviewModel';
import Image from '../image/imageModel';
import noteController from '../note/noteController';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';
import { validateQuery, findAndSort } from '../../helpers/query';
import { cloudinaryPost, formatImages } from '../../helpers/image';
import { merge } from 'lodash';

const recipeGet = asyncMiddleware(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    errorResponse.searchNotFound('recipe');
  }

  res.json(dataResponse({ recipe }));
});

const recipeGetAll = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, [
    'tags',
    'inc',
    'notInc',
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
    model: Recipe,
    as: 'recipes',
    query
  });
});

const recipePost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;

  // If there are images
  // make sure they are in the correct format
  if (req.body.images) {
    req.body.images = formatImages(req.body.images);
  }

  const recipeWithAuthor = merge(
    req.body,
    { userId: new ObjectId(userId) }
  );
  const newRecipe = new Recipe(recipeWithAuthor);
  const createdRecipe = await newRecipe.save();

  if (!createdRecipe) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { recipes: createdRecipe._id } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  res.json(dataResponse({ user: updatedUser, recipe: createdRecipe }));
});

const recipePut = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const recipeId = req.params.id;
  const recipeToUpdate = await Recipe
    .findById(recipeId)
    .select('userId');

  if (!recipeToUpdate) {
    errorResponse.searchNotFound('recipe');
  }

  if (!userId.equals(recipeToUpdate.userId)) {
    errorResponse.unauthorized();
  }

  // Remove unallowed updates
  delete req.body.images;
  delete req.body.reviews;
  delete req.body.rating;

  const updatedRecipe = await Recipe.findByIdAndUpdate(
    recipeId,
    { $set: req.body },
    { new: true }
  );

  res.json(dataResponse({ recipe: updatedRecipe }));
});

const recipeReviewsGet = asyncMiddleware(async (req, res, next) => {
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
    model: Recipe,
    path: 'reviews',
    id: req.params.id,
    query
  });
});

const recipeReviewsPost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const recipeId = req.params.id;
  const userReview = {
    userId,
    recipeId,
    text: req.body.text,
    rating: Number(req.body.rating)
  };
  const recipeToReview = await Recipe.findById(recipeId);

  if (!recipeToReview) {
    errorResponse.searchNotFound('recipe');
  }

  const newReview = await new Review(userReview);
  const createdReview = await newReview.save();

  if (!createdReview) {
    errorResponse.serverError();
  }

  const updatedRecipe = await Recipe.findByIdAndUpdate(
    recipeId,
    { $push: { reviews: createdReview._id } },
    { new: true }
  );

  if (!updatedRecipe) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { reviews: createdReview._id } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  res.json(dataResponse({
    user: updatedUser,
    recipe: updatedRecipe,
    review: newReview
  }));
});

const recipeImagesGet = asyncMiddleware(async (req, res, next) => {

  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, [
    'createdAt',
    'limit',
    'offset'
  ]);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: Recipe,
    path: 'images',
    id: req.params.id,
    query
  });
});

const recipeImagesPost = asyncMiddleware(async (req, res, next) => {
  // Request needs to be enctype="multipart/form-data"
  // Response in JSON
  const userId = req.user._id;
  const recipeId = req.params.id;
  const image = req.file.path;

  const createdCloudinary = await cloudinaryPost(image, {
    width: 600,
    height: 600,
    crop: 'limit'
  });

  if (!createdCloudinary) {
    errorResponse.serverError();
  }

  const newImage = new Image({
    userId,
    recipeId,
    image: createdCloudinary.secure_url,
    imageId: createdCloudinary.public_id
  });
  const createdImage = await newImage.save();

  if (!createdImage) {
    errorResponse.serverError();
  }

  const updatedRecipe = await Recipe.findByIdAndUpdate(
    recipeId,
    { $push: { images: createdImage._id } },
    { new: true }
  );

  if (!updatedRecipe) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { images: createdImage._id } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  res.json(dataResponse({
    user: updatedUser,
    recipe: updatedRecipe,
    image: createdImage
  }));
});

const recipeNotesGet = asyncMiddleware(async (req, res, next) => {
  noteController.noteGet(req, res, next);
});

const recipeNotesPost = asyncMiddleware(async (req, res, next) => {
  noteController.notePost(req, res, next);
});

const recipeNotesPut = asyncMiddleware(async (req, res, next) => {
  noteController.notePut(req, res, next);
});

const recipeNotesDelete = asyncMiddleware(async (req, res, next) => {
  noteController.noteDelete(req, res, next);
});

export default {
  recipeGet,
  recipeGetAll,
  recipePost,
  recipePut,
  recipeReviewsGet,
  recipeReviewsPost,
  recipeImagesGet,
  recipeImagesPost,
  recipeNotesGet,
  recipeNotesPost,
  recipeNotesPut,
  recipeNotesDelete
};
