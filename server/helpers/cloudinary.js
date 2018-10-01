import cloudinary from '../config/cloudinary';
import fs from 'fs';
import { promisify } from 'util';
const unlinkAsync = promisify(fs.unlink);

export const cloudinaryPost = async (imagePath, options) => {
  const createdCloudinary = await cloudinary.v2.uploader.upload(
    imagePath,
    options
  );

  //  Delete file after upload
  await unlinkAsync(imagePath);

  return createdCloudinary;
};

export const cloudinaryDelete = async (imageId) => {
  const destroyedCloudinary = await cloudinary.v2.uploader.destroy(
    { imageId },
    { invalidate: true }
  );

  return destroyedCloudinary;
};
