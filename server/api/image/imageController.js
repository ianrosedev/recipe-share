import Image from './imageModel';
import User from '../user/userModel';
import Recipe from '../recipe/recipeModel';
import Review from '../review/reviewModel';
import { asyncMiddleware } from '../../helpers/async';
import { errorResponse } from '../../helpers/error';
import { dataResponse } from '../../helpers/response';
import { cloudinaryPost, cloudinaryDelete } from '../../helpers/image';

const imageGet = asyncMiddleware(async (req, res, next) => {
  const id = req.params.id;
  const image = await Image.findById(id);

  if (!image) {
    errorResponse.searchNotFound('image');
  }

  res.json(dataResponse({ image }));
});

const imagePost = asyncMiddleware(async (req, res, next) => {
  // Request needs to be enctype="multipart/form-data"
  // Response in JSON
  const userId = req.user._id;
  const image = req.file.path;

  const createdCloudinary = await cloudinaryPost(image, {
    width: 300,
    height: 500,
    crop: 'limit'
  });

  if (!createdCloudinary) {
    errorResponse.serverError();
  }

  const newImage = new Image({
    userId,
    image: createdCloudinary.secure_url,
    imageId: createdCloudinary.public_id
  });
  const createdImage = await newImage.save();

  if (!createdImage) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { images: createdImage._id } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  res.json(dataResponse({ user: updatedUser, image: createdImage }));
});

const imageDelete = asyncMiddleware(async (req, res, next) => {
  const userId = req.user._id;
  const imageId = req.params.id;
  const imageToDestroy = await Image.findById(imageId);

  if (!imageToDestroy) {
    errorResponse.searchNotFound('image');
  }

  if (!userId.equals(imageToDestroy.userId)) {
    errorResponse.unauthorized();
  }

  const destroyedCloudinary = await cloudinaryDelete(imageToDestroy.imageId);

  if (!destroyedCloudinary) {
    errorResponse.serverError();
  }

  const destroyedImage = await imageToDestroy.remove();

  if (!destroyedImage) {
    errorResponse.serverError();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { images: imageId } },
    { new: true }
  );

  if (!updatedUser) {
    errorResponse.serverError();
  }

  if (imageToDestroy.recipeId) {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      imageToDestroy.recipeId,
      { $pull: { images: imageId } }
    );

    if (!updatedRecipe) {
      errorResponse.serverError();
    }
  }

  if (imageToDestroy.reviewId) {
    const updatedReview = await Review.findByIdAndUpdate(
      imageToDestroy.reviewId,
      { $pull: { images: imageId } }
    );

    if (!updatedReview) {
      errorResponse.serverError();
    }
  }

  res.json(dataResponse({
    user: updatedUser,
    destroyed: destroyedImage._id
  }));
});

export default {
  imageGet,
  imagePost,
  imageDelete
};
