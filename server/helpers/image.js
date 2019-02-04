import mongoose from 'mongoose';
import fs from 'fs';
import { promisify } from 'util';
import cloudinary from '../cloudinary';

const { ObjectId } = mongoose.Types;
const asyncUnlink = promisify(fs.unlink);

export const cloudinaryPost = async (imagePath, options) => {
  const createdImage = await cloudinary.v2.uploader.upload(imagePath, options);

  //  Delete file after upload
  await asyncUnlink(imagePath);

  return createdImage;
};

export const cloudinaryDelete = async imageId => {
  const destroyedImage = await cloudinary.v2.uploader.destroy(
    { imageId },
    { invalidate: true }
  );

  return destroyedImage;
};

export const formatImages = images => {
  if (typeof images === 'string') {
    return [ObjectId(images)];
  }

  if (Array.isArray(images)) {
    return Array.from(new Set(images)).map(img => ObjectId(img));
  }

  return [];
};
