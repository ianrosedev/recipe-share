import User from './model';
import { signToken } from '../../auth/auth';
import merge from 'lodash.merge';

const userCreate = async (req, res, next) => {
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

const userUpdate = async (req, res, next) => {
  try {
    const user = req.user;
    const userUpdate = req.body;
    const update = merge(user, userUpdate);
    const updatedUser = await user.save(update);

    res.json(updatedUser);
  }
  catch (err) {
    next(err);
  }
};

const userDestroy = async (req, res, next) => {
  try {
    const user = req.user;
    const destroyedUser = await user.remove();

    res.json({ _id: destroyedUser.id });
  }
  catch (err) {
    next(err);
  }
};

const userMeRead = async (req, res, next) => {
  try {
    const user = req.user;

    res.json(user);
  }
  catch (err) {
    next(err);
  }
};

const userIdRead = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(
      id,
      'username location snippet profileImage'
    );

    res.json(user);
  }
  catch (err) {
    next(err);
  }
};

export default {
  userCreate,
  userUpdate,
  userDestroy,
  userMeRead,
  userIdRead
};
