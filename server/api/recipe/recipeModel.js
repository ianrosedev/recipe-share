import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag'
    }],
    images: [Schema.Types.ObjectId],
    snippet: {
      type: String,
      required: true
    },
    ingredients: [{
      type: String,
      required: true
    }],
    directions: [{
      type: String,
      required: true
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
      required: true
    },
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
