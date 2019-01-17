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
  },
  {
    timestamps: true,
  }
);

// Checking for existing model keeps
// tests from having an OverwriteModelError
export default mongoose.models.Note || mongoose.model('Note', schema);
