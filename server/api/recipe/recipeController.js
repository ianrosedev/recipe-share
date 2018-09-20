import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Recipe from './recipeModel';
import User from '../user/userModel';
import Review from '../review/reviewModel';
import { findAndSort } from '../../helpers/query';
import merge from 'lodash.merge';
import pick from 'lodash.pick';

const recipeGet = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    res.json({ recipe });
  }
  catch (err) {
    next(err);
  }
};

// WIP: Query parameters
const recipeGetAll = async (req, res, next) => {
  try {
    // Abstract and move when done
    const query = req.query;
    const sorting = {};

    if (query.createdAt) sorting.createdAt = query.createdAt;
    if (query.rating) sorting.rating = query.rating;

    const recipes = await Recipe
      .find({})
      .sort(sorting)
      .skip(Number(query.offset))
      .limit(Number(query.limit) || 10);

    res.json({ recipes });
  }
  catch (err) {
    next(err);
  }
};

const recipePost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeWithAuthor = merge(
      req.body,
      { userId: new ObjectId(userId) }
    );
    const newRecipe = new Recipe(recipeWithAuthor);
    const createdRecipe = await newRecipe.save();

    if (!createdRecipe) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { recipes: new ObjectId(createdRecipe._id) } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({ user: updatedUser, recipe: createdRecipe });
  }
  catch (err) {
    next(err);
  }
};

const recipePut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const recipeToUpdate = await Recipe
      .findById(recipeId)
      .select('userId');

    if (!userId.equals(recipeToUpdate.userId)) {
      res
        .status(400)
        .json({ message: 'Not authorized to update this recipe!' });
      return;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      { _id: recipeId },
      req.body,
      { new: true }
    );

    res.json({ recipe: updatedRecipe });
  }
  catch (err) {
    next(err);
  }
};

// TODO: Need to destroy all references to this
// from the other related documents
const recipeDelete = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const recipeToDestroy = await Recipe
      .findById(recipeId)
      .select('userId');

    if (!recipeToDestroy) {
      res.status(400).json({ message: 'No recipe with that id' });
      return;
    }

    if (!userId.equals(recipeToDestroy.userId)) {
      res
        .status(401)
        .json({ message: 'Not authorized to delete this recipe!' });
      return;
    }

    // Can only delete private recipes
    if (!recipeToDestroy.isPrivate) {
      res
        .status(403)
        .json({ message: 'You can only delete private recipes!' });
      return;
    }

    const destroyedRecipe = await recipeToDestroy.remove();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { recipes: recipeId } },
      { new: true }
    );

    res.json({ user: updatedUser, destroyed: destroyedRecipe._id });
  }
  catch (err) {
    next(err);
  }
};

const recipeReviewsGet = async (req, res, next) => {
  try {
    // Make sure only permitted operations are sent to query
    const query = pick(
      req.query,
      'createdAt',
      'rating',
      'stars',
      'limit',
      'offset'
    );

    findAndSort(req, res, next, {
      model: Recipe,
      path: 'reviews',
      id: req.params.id,
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const recipeReviewsPost = async (req, res, next) => {
  try {
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
      res.status(400).json({ message: 'No recipe with that id!' });
      return;
    }

    const newReview = await new Review(userReview);
    const createdReview = await newReview.save();
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      { _id: recipeId },
      { $push: { reviews: createdReview._id } },
      { new: true }
    );

    if (!updatedRecipe) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { reviews: createdReview._id } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({
      user: updatedUser,
      recipe: updatedRecipe,
      review: newReview
    });
  }
  catch (err) {
    next(err);
  }
};

export default {
  recipeGet,
  recipeGetAll,
  recipePost,
  recipePut,
  recipeDelete,
  recipeReviewsGet,
  recipeReviewsPost
};
