import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import config from '../config';
import User from '../api/user/userModel';

export const signToken = (id, expireTime = config.expireTime) => {
  return jwt.sign(
    { _id: id },
    config.secrets.jwt,
    { expiresIn: expireTime }
  );
};

export const checkToken = (req, res, next) => {
  const check = expressJwt({ secret: config.secrets.jwt });
  // Returns middleware
  check(req, res, next);
};

export const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
    } else {
      req.user = user;
      next();
    }
  }
  catch (err) {
    next(err);
  }
};

export const verifyLoginEmail = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).json({ message: 'You need an email and password' });
    return;
  }

  try {
    const user = await User.findOne({ email }).select('+password +email');

    if (!user) {
      res.status(401).json({ message: 'No user with the given username' });
    } else {
      const isAuthenticated = await user.authenticatePassword(password);

      if (!isAuthenticated) {
        res.status(401).json({ message: 'Wrong password' });
      } else {
        req.user = user.sanitize();
        next();
      }
    }
  }
  catch (err) {
    next(err);
  }
};
