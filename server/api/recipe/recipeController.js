import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Recipe from './recipeModel';
import User from '../user/userModel';
import Review from '../review/reviewModel';
import Image from '../image/imageModel';
import { validateQuery, findAndSort } from '../../helpers/query';
import { cloudinaryPost } from '../../helpers/cloudinary';
import { merge, uniq } from 'lodash';

const recipeGet = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    res.json({ recipe });
  }
  catch (err) {
    next(err);
  }
};

const recipeGetAll = async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  try {
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
      res.status(400).send({ message: 'Bad request!' });
      return;
    }

    findAndSort(req, res, next, {
      model: Recipe,
      as: 'recipes',
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const recipePost = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // If there are images
    // make sure they are in the correct format
    if (req.body.images) {
      const images = req.body.images;

      if (typeof images === 'string') {
        req.body.images = [mongoose.Types.ObjectId(images)];
      } else {
        req.body.images = uniq(images).map(img => mongoose.Types.ObjectId(img));
      }
    }

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
      { $push: { recipes: createdRecipe._id } },
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

    if (!recipeToUpdate) {
      res.status(400).json({ message: 'No recipe with that id!' });
      return;
    }

    if (!userId.equals(recipeToUpdate.userId)) {
      res
        .status(400)
        .json({ message: 'Not authorized to update this recipe!' });
      return;
    }

    // Remove unallowed updates
    delete req.body.images;
    delete req.body.reviews;
    delete req.body.rating;

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

const recipeReviewsGet = async (req, res, next) => {
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

const recipeImagesGet = async (req, res, next) => {
  try {
    // Make sure only permitted operations are sent to query
    const query = validateQuery(req.query, [
      'createdAt',
      'limit',
      'offset'
    ]);

    if (!query) {
      res.status(400).send({ message: 'Bad request!' });
      return;
    }

    findAndSort(req, res, next, {
      model: Recipe,
      path: 'images',
      id: req.params.id,
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const recipeImagesPost = async (req, res, next) => {
  // Request needs to be enctype="multipart/form-data"
  // Response in JSON
  try {
    const userId = req.user._id;
    const recipeId = req.params.id;
    const image = req.file.path;

    const createdCloudinary = await cloudinaryPost(image, {
      width: 600,
      height: 600,
      crop: 'limit'
    });

    if (!createdCloudinary) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const newImage = new Image({
      userId,
      recipeId,
      image: createdCloudinary.secure_url,
      imageId: createdCloudinary.public_id
    });
    const createdImage = await newImage.save();

    if (!createdImage) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { $push: { images: createdImage._id } },
      { new: true }
    );

    if (!updatedRecipe) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { images: createdImage._id } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({ user: updatedUser, recipe: updatedRecipe, image: createdImage });
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
  recipeReviewsGet,
  recipeReviewsPost,
  recipeImagesGet,
  recipeImagesPost
};
