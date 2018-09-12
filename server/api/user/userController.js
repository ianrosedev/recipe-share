import User from './userModel';
import { signToken } from '../../auth/auth';
import merge from 'lodash.merge';
import { populateAndSort } from '../../helpers/query';

const userGet = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(
      id,
      'username location snippet profileImage'
    );

    res.json({ user });
  }
  catch (err) {
    next(err);
  }
};

const userPost = async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    newUser.password = await newUser.hashPassword(newUser.password);
    const createdUser = await newUser.save();
    const token = await signToken(createdUser._id);

    res.status(201).json({ token });
  }
  catch (err) {
    next(err);
  }
};

const userPut = async (req, res, next) => {
  try {
    const user = req.user;
    const userUpdate = req.body;
    const update = merge(user, userUpdate);
    const updatedUser = await user.save(update);

    res.json({ user: updatedUser });
  }
  catch (err) {
    next(err);
  }
};

const userDelete = async (req, res, next) => {
  try {
    const user = req.user;
    const destroyedUser = await user.remove();

    res.json({ destroyed: destroyedUser.id });
  }
  catch (err) {
    next(err);
  }
};

const userMeGet = async (req, res, next) => {
  try {
    const user = req.user;

    res.json({ user });
  }
  catch (err) {
    next(err);
  }
};

const userRecipesGet = async (req, res, next) => {
  try {
    const userRecipes = await populateAndSort(req, res, next, {
      model: User,
      path: 'recipes'
    });

    res.json(await userRecipes);
  }
  catch (err) {
    next(err);
  }
};

const userReviewsGet = async (req, res, next) => {
  try {
    const userReviews = await populateAndSort(req, res, next, {
      model: User,
      path: 'reviews'
    });

    res.json(await userReviews);
  }
  catch (err) {
    next(err);
  }
};

export default {
  userGet,
  userPost,
  userPut,
  userDelete,
  userMeGet,
  userRecipesGet,
  userReviewsGet
};
