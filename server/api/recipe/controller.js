import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Recipe from './model';
import User from '../user/model';
import Review from '../review/model';

const recipeCreate = async (req, res, next) => {
  try {
    const user = req.user;
    const recipeWithAuthor = {
      ...req.body,
      author: new ObjectId(user._id)
    };
    const newRecipe = new Recipe(recipeWithAuthor);
    const createdRecipe = await newRecipe.save();

    if (!createdRecipe) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
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

const recipeRead = async (req, res, next) => {
  try {
    // WIP: Query parameters
    // Abstract and move when done
    const query = req.query;
    const sorting = {};

    if (query.createdAt) sorting.createdAt = query.createdAt;
    if (query.rating) sorting.rating = query.rating;

    const recipes = await Recipe
      .find({})
      .sort(sorting)
      .skip(query.offset)
      .limit(query.limit || 5);

    res.json(recipes);
  }
  catch (err) {
    next(err);
  }
};

const recipeIdRead = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    res.json(recipe);
  }
  catch (err) {
    next(err);
  }
};

const recipeIdUpdate = async (req, res, next) => {
  try {
    const user = req.user;
    const recipeId = req.params.id;
    const recipeToUpdate = await Recipe.findById(recipeId).select('author');

    if (!user._id.equals(recipeToUpdate.author)) {
      res.status(400).json({ message: 'Not authorized to update this recipe!' });
      return;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      { _id: recipeId },
      req.body,
      { new: true }
    );

    res.json(updatedRecipe);
  }
  catch (err) {
    next(err);
  }
};

const recipeIdDestroy = async (req, res, next) => {
  // TODO: Need to destroy all references to this
  // from the other related documents
  try {
    const user = req.user;
    const recipeId = req.params.id;
    const recipeToDestroy = await Recipe.findById(recipeId).select('author');

    if (!recipeToDestroy) {
      res.status(400).json({ message: 'No recipe with that id' });
      return;
    }

    if (!user._id.equals(recipeToDestroy.author)) {
      res.status(400).json({ message: 'Not authorized to delete this recipe!' });
      return;
    }

    const destroyedRecipe = await recipeToDestroy.remove();
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $pull: { recipes: recipeId } },
      { new: true }
    );

    res.json({ updatedUser, destroyed: destroyedRecipe._id });
  }
  catch (err) {
    next(err);
  }
};

const recipeIdReviewCreate = async (req, res, next) => {
  try {
    const user = req.user;
    const recipeId = req.params.id;
    const userReview = {
      userId: user._id,
      recipeId,
      text: req.body.text
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
      user._id,
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
  recipeCreate,
  recipeRead,
  recipeIdRead,
  recipeIdUpdate,
  recipeIdDestroy,
  recipeIdReviewCreate
};
