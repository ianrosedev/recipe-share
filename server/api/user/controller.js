import User from './model';
import { signToken } from '../../auth/auth';

const createUser = async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    newUser.password = await newUser.hashPassword(newUser.password);
    const createdUser = await newUser.save();
    const token = await signToken(createdUser._id);

    res.json({ token });
  }
  catch (err) {
    next(err);
  }
};

export default {
  createUser
};
