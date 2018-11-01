import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import config from '../config';
import User from '../api/user/userModel';
import { asyncMiddleware } from '../helpers/async';
import { errorResponse } from '../helpers/error';

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

export const verifyUser = asyncMiddleware(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    errorResponse.unauthorized();
  } else {
    req.user = user;
    next();
  }
});

export const verifyLoginEmail = asyncMiddleware(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    errorResponse.customBadRequest('You need an email');
  }

  if (!password) {
    errorResponse.customBadRequest('You need a password');
  }

  const user = await User.findOne({ email }).select('+password +email');

  if (!user) {
    errorResponse.customBadRequest('No user with that username');
  } else {
    const isAuthenticated = await user.authenticatePassword(password);

    if (!isAuthenticated) {
      errorResponse.unauthorized();
    } else {
      req.user = user.sanitize();
      next();
    }
  }
});
