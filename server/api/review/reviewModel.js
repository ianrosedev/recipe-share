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

export default mongoose.model('Review', schema);
