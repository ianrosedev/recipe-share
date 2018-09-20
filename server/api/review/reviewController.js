import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Review from './reviewModel';
import User from '../user/userModel';
import { findAndSort } from '../../helpers/query';
import pick from 'lodash.pick';

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
    const query = pick(
      req.query,
      'createdAt',
      'rating',
      'stars',
      'limit',
      'offset'
    );

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
      { _id: reviewId },
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
      .select('userId');

    if (!reviewToDestroy) {
      res.status(400).json({ message: 'No review with that id' });
      return;
    }

    if (!userId.equals(reviewToDestroy.userId)) {
      res.status(400).json({ message: 'Not authorized to delete this review!' });
      return;
    }

    const destroyedReview = await reviewToDestroy.remove();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { reviews: reviewId } },
      { new: true }
    );

    res.json({ user: updatedUser, review: destroyedReview._id });
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
