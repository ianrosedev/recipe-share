import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Checking for existing model keeps
// tests from having an OverwriteModelError
export default mongoose.models.Tag || mongoose.model('Tag', schema);
