import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    recipeId: Schema.Types.ObjectId,
    reviewId: Schema.Types.ObjectId,
    image: {
      type: String,
      required: true
    },
    imageId: {
      type: String,
      required: true
    },
    text: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Image', schema);