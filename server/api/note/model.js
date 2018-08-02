import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    recipeId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    note: {
      type: String,
      required: true
    }
  }
);

export default mongoose.model('Note', schema);
