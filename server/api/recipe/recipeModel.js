import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    images: [{
      type: Schema.Types.ObjectId,
      ref: 'Image'
    }],
    snippet: {
      type: String,
      required: true
    },
    ingredients: [{
      type: String,
      trim: true,
      required: true
    }],
    directions: [{
      type: String,
      required: true
    }],
    // !!!
    // Needs to be average of review ratings
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
      required: true
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    reviews: [{
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }]
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Recipe', schema);
