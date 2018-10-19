import User from './userModel';
import recipeController from '../recipe/recipeController';
import collectionController from '../collection/collectionController';
import imageController from '../image/imageController';
import { signToken } from '../../auth/auth';
import { validateQuery, findAndSort } from '../../helpers/query';
import { formatImages } from '../../helpers/images';
import { merge } from 'lodash';

const userGet = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(
      id,
      'username location snippet profileImage'
    );

    res.json({ user });
  }
  catch (err) {
    next(err);
  }
};

const userPost = async (req, res, next) => {
  try {
    // If there are images
    // make sure they are in the correct format
    if (req.body.images) {
      req.body.images = await formatImages(req.body.images);
    }

    const newUser = new User(req.body);
    newUser.password = await newUser.hashPassword(newUser.password);
    const createdUser = await newUser.save();
    const token = await signToken(createdUser._id);

    res.status(201).json({ token });
  }
  catch (err) {
    next(err);
  }
};

const userPut = async (req, res, next) => {
  try {
    const user = req.user;

    // If there are images
    // make sure they are in the correct format
    if (req.body.images) {
      req.body.images = await formatImages(req.body.images);
    }

    const userUpdate = req.body;
    const update = merge(user, userUpdate);
    const updatedUser = await user.save(update);

    res.json({ user: updatedUser });
  }
  catch (err) {
    next(err);
  }
};

const userDelete = async (req, res, next) => {
  try {
    const user = req.user;
    const destroyedUser = await user.remove();

    res.json({ destroyed: destroyedUser.id });
  }
  catch (err) {
    next(err);
  }
};

const userMeGet = async (req, res, next) => {
  try {
    const user = req.user;

    res.json({ user });
  }
  catch (err) {
    next(err);
  }
};

const userRecipesGet = async (req, res, next) => {
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
      model: User,
      path: 'recipes',
      id: req.params.id,
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const userRecipesPost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const paramId = req.params.id;

    if (!userId.equals(paramId)) {
      res.status(401).send({ message: 'Unauthorized!' });
      return;
    }

    recipeController.recipePost(req, res, next);
  }
  catch (err) {
    next(err);
  }
};

const userReviewsGet = async (req, res, next) => {
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
      model: User,
      path: 'reviews',
      id: req.params.id,
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const userCollectionsGet = async (req, res, next) => {
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
      model: User,
      path: 'collections',
      id: req.params.id,
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const userCollectionsGetAll = async (req, res, next) => {
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
      model: User,
      path: 'collections',
      id: req.params.id,
      query,
      // Only allow public collections
      filter: collection => collection.isPrivate === false
    });
  }
  catch (err) {
    next(err);
  }
};

const userCollectionsPost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const paramId = req.params.id;

    if (!userId.equals(paramId)) {
      res.status(401).send({ message: 'Unauthorized!' });
      return;
    }

    collectionController.collectionPost(req, res, next);
  }
  catch (err) {
    next(err);
  }
};

const userImagesGet = async (req, res, next) => {
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
      model: User,
      path: 'images',
      id: req.params.id,
      query
    });
  }
  catch (err) {
    next(err);
  }
};

const userImagesPost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const paramId = req.params.id;

    if (!userId.equals(paramId)) {
      res.status(401).send({ message: 'Unauthorized!' });
      return;
    }

    imageController.imagePost(req, res, next);
  }
  catch (err) {
    next(err);
  }
};

export default {
  userGet,
  userPost,
  userPut,
  userDelete,
  userMeGet,
  userRecipesGet,
  userRecipesPost,
  userReviewsGet,
  userCollectionsGet,
  userCollectionsGetAll,
  userCollectionsPost,
  userImagesGet,
  userImagesPost
};
