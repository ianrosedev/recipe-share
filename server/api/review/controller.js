import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import Review from './model';

const reviewRead = async (req, res, next) => {
  try {
    const allReviews = await Review.find({});

    res.json({ allReviews });
  }
  catch (err) {
    next(err);
  }
};

export default {
  reviewRead
};
