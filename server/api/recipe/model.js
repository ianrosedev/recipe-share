import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    author: {
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
      min: 0,
      max: 5,
      default: 0
    },
    reviews: [Schema.Types.ObjectId]
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Recipe', schema);
