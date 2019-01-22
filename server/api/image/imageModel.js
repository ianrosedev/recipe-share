import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    recipeId: Schema.Types.ObjectId,
    reviewId: Schema.Types.ObjectId,
    image: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
      required: true,
    },
    text: String,
  },
  {
    timestamps: true,
  }
);

// Checking for existing model keeps
// tests from having an OverwriteModelError
export default mongoose.models.Image || mongoose.model('Image', schema);
