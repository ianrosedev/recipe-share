import mongoose from 'mongoose';
import { merge } from 'lodash';
import Collection from './collectionModel';
import User from '../user/userModel';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';
import { validateQuery, findAndSort } from '../../helpers/query';

const { ObjectId } = mongoose.Types;

const collectionGet = asyncMiddleware(async (req, res, next) => {
  const collectionId = req.params.id;
  const collection = await Collection.findById(collectionId);

  if (collection.isPrivate) {
    errorResponse.unauthorized();
  }

  res.json(dataResponse({ collection }));
});

const collectionGetAll = asyncMiddleware(async (req, res, next) => {
  // Make sure only permitted operations are sent to query
  const query = validateQuery(req.query, ['createdAt', 'limit', 'offset']);

  if (!query) {
    errorResponse.invalidQuery();
  }

  findAndSort(req, res, next, {
    model: Collection,
    as: 'collections',
    query,
    // Only allow public collections
    filter: collection => collection.isPrivate === false,
  });
});

const collectionPost = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const collectionWithUserId = merge(req.body, {
    userId: new ObjectId(userId),
  });
  const newCollection = new Collection(collectionWithUserId);
  const createdCollection = await newCollection.save();

  if (!createdCollection) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { collections: createdCollection._id } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  res.json(
    dataResponse({
      user: updatedUser,
      collection: createdCollection,
    })
  );
});

const collectionPut = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const collectionId = req.params.id;
  const collectionToUpdate = await Collection.findById(collectionId);
  const { body } = req;
  const options = {};

  if (!userId.equals(collectionToUpdate.userId)) {
    errorResponse.unauthorized();
  }

  if (
    Object.prototype.hasOwnProperty.call(body, 'name') &&
    body.name.length === 0
  ) {
    errorResponse.customBadRequest('Name cannot be empty');
  }

  if (body.name || Object.prototype.hasOwnProperty.call(body, 'isPrivate')) {
    options.$set = {};

    if (body.name) {
      options.$set.name = body.name;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isPrivate')) {
      options.$set.isPrivate = body.isPrivate;
    }
  }

  if (body.addRecipe) {
    // Make sure recipe is NOT in array
    if (collectionToUpdate.recipes.includes(new ObjectId(body.addRecipe))) {
      errorResponse.customBadRequest('Recipe already exists');
    }

    options.$push = { recipes: new ObjectId(body.addRecipe) };
  }

  if (body.removeRecipe) {
    // Make sure recipe is in array
    if (!collectionToUpdate.recipes.includes(new ObjectId(body.removeRecipe))) {
      errorResponse.searchNotFound('recipe');
    }

    options.$pull = { recipes: body.removeRecipe };
  }

  const updatedCollection = await Collection.findByIdAndUpdate(
    collectionId,
    { ...options },
    { new: true }
  );

  res.json(dataResponse(updatedCollection));
});

const collectionDelete = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const collectionId = req.params.id;
  const collectionToDestroy = await Collection.findById(collectionId).select(
    'userId'
  );

  if (!collectionToDestroy) {
    errorResponse.searchNotFound('collection');
  }

  if (!userId.equals(collectionToDestroy.userId)) {
    errorResponse.unauthorized();
  }

  const destroyedCollection = await collectionToDestroy.remove();
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { collections: collectionId } },
    { new: true }
  );

  res.json(
    dataResponse({
      user: updatedUser,
      collection: destroyedCollection._id,
    })
  );
});

export default {
  collectionGet,
  collectionGetAll,
  collectionPost,
  collectionPut,
  collectionDelete,
};
