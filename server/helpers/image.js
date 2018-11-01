import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import cloudinary from '../config/cloudinary';
import fs from 'fs';
import { promisify } from 'util';
const asyncUnlink = promisify(fs.unlink);
import { uniq } from 'lodash';

export const cloudinaryPost = async (imagePath, options) => {
  const createdImage = await cloudinary.v2.uploader.upload(
    imagePath,
    options
  );

  //  Delete file after upload
  await asyncUnlink(imagePath);

  return createdImage;
};

export const cloudinaryDelete = async (imageId) => {
  const destroyedImage = await cloudinary.v2.uploader.destroy(
    { imageId },
    { invalidate: true }
  );

  return destroyedImage;
};

export const formatImages = (images) => {
  if (typeof images === 'string') {
    return [ObjectId(images)];
  } else if (Array.isArray(images)) {
    return uniq(images).map(img => ObjectId(img));
  } else {
    return [];
  }
};
