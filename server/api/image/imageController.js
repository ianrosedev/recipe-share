import Image from './imageModel';
import User from '../user/userModel';
import Recipe from '../recipe/recipeModel';
import Review from '../review/reviewModel';
import { cloudinaryPost, cloudinaryDelete } from '../../helpers/cloudinary';

const imageGet = async (req, res, next) => {
  try {
    const id = req.params.id;
    const image = await Image.findById(id);

    res.json({ image });
  }
  catch (err) {
    next(err);
  }
};

const imagePost = async (req, res, next) => {
  // Request needs to be enctype="multipart/form-data"
  // Response in JSON
  try {
    const userId = req.user._id;
    const image = req.file.path;

    const createdCloudinary = await cloudinaryPost(image, {
      width: 300,
      height: 500,
      crop: 'limit'
    });

    if (!createdCloudinary) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const newImage = new Image({
      userId,
      image: createdCloudinary.secure_url,
      imageId: createdCloudinary.public_id
    });
    const createdImage = await newImage.save();

    if (!createdImage) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { images: createdImage._id } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    res.json({ user: updatedUser, image: createdImage });
  }
  catch (err) {
    next(err);
  }
};

const imageDelete = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const imageId = req.params.id;
    const imageToDestroy = await Image.findById(imageId);

    if (!imageToDestroy) {
      res.status(400).json({ message: 'No image with that id' });
      return;
    }

    if (!userId.equals(imageToDestroy.userId)) {
      res
        .status(401)
        .json({ message: 'Not authorized to delete this image!' });
      return;
    }

    const destroyedCloudinary = await cloudinaryDelete(imageToDestroy.imageId);

    if (!destroyedCloudinary) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const destroyedImage = await imageToDestroy.remove();

    if (!destroyedImage) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { images: imageId } },
      { new: true }
    );

    if (!updatedUser) {
      res.status(400).json({ message: 'Something went wrong' });
      return;
    }

    if (imageToDestroy.recipeId) {
      const updatedRecipe = await Recipe.findByIdAndUpdate(
        imageToDestroy.recipeId,
        { $pull: { images: imageId } }
      );

      if (!updatedRecipe) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
      }
    }

    if (imageToDestroy.reviewId) {
      const updatedReview = await Review.findByIdAndUpdate(
        imageToDestroy.reviewId,
        { $pull: { images: imageId } }
      );

      if (!updatedReview) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
      }
    }

    res.json({ user: updatedUser, destroyed: destroyedImage._id })

  }
  catch (err) {
    next(err);
  }
};

export default {
  imageGet,
  imagePost,
  imageDelete
};
