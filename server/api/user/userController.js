import { merge } from 'lodash';
import User from './userModel';
import recipeController from '../recipe/recipeController';
import collectionController from '../collection/collectionController';
import imageController from '../image/imageController';
import { signToken } from '../../auth/auth';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';
import { validateQuery, findAndSort } from '../../helpers/query';
import { formatImages } from '../../helpers/image';

const userGet = asyncMiddleware(async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findById(userId);

  if (!user) {
    errorResponse.searchNotFound('user');
  }

  res.json(dataResponse({ user }));
});

const userPost = asyncMiddleware(async (req, res, next) => {
  // If there are images
  // make sure they are in the correct format
  if (req.body.images) {
    req.body.images = await formatImages(req.body.images);
  }

  const newUser = new User(req.body);
  newUser.password = await newUser.hashPassword(newUser.password);
  const createdUser = await newUser.save();

  if (!createdUser) {
    errorResponse.serverError();
  }

  const token = await signToken(createdUser._id);

  res.status(201).json(dataResponse({ token }, 201));
});

const userPut = asyncMiddleware(async (req, res, next) => {
  const { user } = req;

  // If there are images
  // make sure they are in the correct format
  if (req.body.images) {
    req.body.images = await formatImages(req.body.images);
  }

  const userUpdate = req.body;
  const update = merge(user, userUpdate);
  const updatedUser = await user.save(update);

  res.json(dataResponse({ user: updatedUser }));
});

const userDelete = asyncMiddleware(async (req, res, next) => {
  const { user } = req;
  const destroyedUser = await user.remove();

  if (!destroyedUser) {
    errorResponse.serverError();
  }

  res.json(dataResponse({ destroyed: destroyedUser.id }));
});

const userMeGet = asyncMiddleware(async (req, res, next) => {
  const { user } = req;

  res.json(dataResponse({ user }));
});

const userRecipesGet = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, [
    'createdAt',
    'rating',
    'stars',
    'limit',
    'offset',
  ]);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: User,
    path: 'recipes',
    id: req.params.id,
    query,
  });
});

const userRecipesPost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const paramId = req.params.id;

  if (!userId.equals(paramId)) {
    errorResponse.unauthorized();
  }

  recipeController.recipePost(req, res, next);
});

const userReviewsGet = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, [
    'createdAt',
    'rating',
    'stars',
    'limit',
    'offset',
  ]);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: User,
    path: 'reviews',
    id: req.params.id,
    query,
  });
});

const userCollectionsGet = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, ['createdAt', 'limit', 'offset']);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: User,
    path: 'collections',
    id: req.params.id,
    query,
  });
});

const userCollectionsGetAll = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, ['createdAt', 'limit', 'offset']);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: User,
    path: 'collections',
    id: req.params.id,
    query,
    // Only allow public collections
    filter: collection => collection.isPrivate === false,
  });
});

const userCollectionsPost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const paramId = req.params.id;

  if (!userId.equals(paramId)) {
    errorResponse.unauthorized();
  }

  collectionController.collectionPost(req, res, next);
});

const userImagesGet = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, ['createdAt', 'limit', 'offset']);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: User,
    path: 'images',
    id: req.params.id,
    query,
  });
});

const userImagesPost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const paramId = req.params.id;

  if (!userId.equals(paramId)) {
    errorResponse.unauthorized();
  }

  imageController.imagePost(req, res, next);
});

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
  userImagesPost,
};
