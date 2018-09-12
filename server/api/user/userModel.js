import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import bcrypt from 'bcrypt';

const schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      select: false
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    location: String,
    snippet: String,
    profileImage: String,
    images: [Schema.Types.ObjectId],
    recipes: [{
      type: Schema.Types.ObjectId,
      ref: 'Recipe'
    }],
    collections: [Schema.Types.ObjectId],
    reviews: [{
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }],
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
  },
  authenticatePassword(plaintextPassword) {
    // Returns promise
    return bcrypt.compare(plaintextPassword, this.password);
  },
  hashPassword(plaintextPassword) {
    // Returns promise
    return bcrypt.hash(plaintextPassword, 12);
  }
};

export default mongoose.model('User', schema);
