import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Checking for existing model keeps
// tests from having an OverwriteModelError
export default mongoose.models.Review || mongoose.model('Review', schema);
