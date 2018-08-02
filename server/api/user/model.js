import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    images: [Schema.Types.ObjectId],
    recipes: [Schema.Types.ObjectId],
    collections: [Schema.Types.ObjectId],
    reviews: [Schema.Types.ObjectId],
    notes: [Schema.Types.ObjectId]
  },
  {
    timestamps: true
  }
);

export default mongoose.model('User', schema);
