import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      default: 'My Collection',
      minLegth: 1,
      trim: true,
      required: true,
    },
    recipes: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Checking for existing model keeps
// tests from having an OverwriteModelError
export default mongoose.models.Collection ||
  mongoose.model('Collection', schema);
