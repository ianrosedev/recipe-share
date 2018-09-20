import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      default: 'My Collection',
      minLegth: 1,
      trim: true,
      required: true
    },
    recipes: [{
      type: Schema.Types.ObjectId,
      // FIX!
      unique: true
    }],
    isPrivate: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Collection', schema);
