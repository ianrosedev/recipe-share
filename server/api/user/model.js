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
      required: true,
      select: false
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

schema.methods = {
  sanitize() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  }
};

export default mongoose.model('User', schema);
