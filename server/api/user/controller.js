import User from './model';

const createUser = async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    const createdUser = await newUser.save();
    const sanitizedUser = await createdUser.sanitize();

    res.json(sanitizedUser);
  }
  catch (err) {
    next(err);
  }
};

export default {
  createUser
};
