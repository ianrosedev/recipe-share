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

export default mongoose.model('Tag', schema);