import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Collection from './collectionModel';
import User from '../user/userModel';
import { validateQuery, findAndSort } from '../../helpers/query';
import { merge } from 'lodash';

const collectionGet = async (req, res, next) => {
  try {
    const collectionId = req.params.id;
    const collection = await Collection
      .findById(collectionId)
      .lean();

    if (collection.isPrivate) {
      res.status(401).json({ message: 'Not authorized!' });
      return;
    }

    res.json({ collection });
  }
  catch (err) {
    next(err);
  }
};

const collectionGetAll = async (req, res, next) => {
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
      model: Collection,
      as: 'collections',
      query,
      // Only allow public collections
      filter: collection => collection.isPrivate === false
    });
  }
  catch (err) {
    next(err);
  }
};

const collectionPost = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const collectionWithUserId = merge(
      req.body,
      { userId: new ObjectId(userId) }
    );
    const newCollection = new Collection(collectionWithUserId);
    const createdCollection = await newCollection.save();

    if (!createdCollection) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { collections: createdCollection._id } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({ user: updatedUser, collection: createdCollection });
  }
  catch (err) {
    next(err);
  }
};

const collectionPut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const collectionId = req.params.id;
    const collectionToUpdate = await Collection.findById(collectionId);
    const body = req.body;
    const options = {};

    if (!userId.equals(collectionToUpdate.userId)) {
      res
        .status(400)
        .json({ message: 'Not authorized to update this collection!' });
      return;
    }

    if (body.hasOwnProperty('name') && body.name.length === 0) {
      res.status(400).json({ message: 'Name cannot be empty!' });
      return;
    }

    if (body.name || body.hasOwnProperty('isPrivate')) {
      options.$set = {};

      if (body.name) {
        options.$set.name = body.name;
      }

      if (body.hasOwnProperty('isPrivate')) {
        options.$set.isPrivate = body.isPrivate;
      }
    }

    if (body.addRecipe) {
      // Make sure recipe is NOT in array
      if (collectionToUpdate.recipes.indexOf(
        new ObjectId(body.addRecipe)
      ) >= 0) {
        res.status(400).json({ message: 'Recipe already in collection!' });
        return;
      }

      options.$push = { recipes: new ObjectId(body.addRecipe) };
    }

    if (body.removeRecipe) {
      // Make sure recipe is in array
      if (collectionToUpdate.recipes.indexOf(
        new ObjectId(body.removeRecipe)
      ) < 0) {
        res.status(400).json({ message: 'No recipe with that id!' });
        return;
      }

      options.$pull = { recipes: body.removeRecipe };
    }

    const updatedCollection = await Collection.findByIdAndUpdate(
      collectionId,
      { ...options },
      { new: true }
    );

    res.json(updatedCollection);
  }
  catch (err) {
    next(err);
  }
};

const collectionDelete = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const collectionId = req.params.id;
    const collectionToDestroy = await Collection
      .findById(collectionId)
      .select('userId');

    if (!collectionToDestroy) {
      res.status(400).json({ message: 'No collection with that id' });
      return;
    }

    if (!userId.equals(collectionToDestroy.userId)) {
      res
        .status(400)
        .json({ message: 'Not authorized to delete this collection!' });
      return;
    }

    const destroyedCollection = await collectionToDestroy.remove();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { collections: collectionId } },
      { new: true }
    );

    res.json({ user: updatedUser, collection: destroyedCollection._id });
  }
  catch (err) {
    next(err);
  }
};

export default {
  collectionGet,
  collectionGetAll,
  collectionPost,
  collectionPut,
  collectionDelete
};
