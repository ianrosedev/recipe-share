import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const schema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      minLength: 1,
      maxLength: 72,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      select: false,
    },
    password: {
      type: String,
      trim: true,
      minLength: 8,
      maxLength: 72,
      required: true,
      select: false,
    },
    location: {
      type: String,
      trim: true,
    },
    snippet: String,
    profileImage: String,
    images: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],
    recipes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Recipe',
      },
    ],
    collections: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Collection',
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    notes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Note',
      },
    ],
  },
  {
    timestamps: true,
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
  },
};

// Checking for existing model keeps
// tests from having an OverwriteModelError
export default mongoose.models.User || mongoose.model('User', schema);
