import Boom from 'boom';
import config from '../config';

export default (err, req, res, next) => {
  // if (err.isServer) {
  //   // log the error...
  //   // probably you don't want to log unauthorized access
  //   // or do you?
  // }

  if (config.env === 'development') {
    console.log(err);
  }

  // Unauthorized
  if (err.name === 'UnauthorizedError') {
    err = Boom.unauthorized();
  }

  // Duplicate
  if (err.name === 'MongoError' && err.code === 11000) {
    err = new Boom('Duplicate', { statusCode: 401 });
  }

  // Bad MongoId
  if (err.name === 'CastError') {
    err = new Boom('Invalid ID', { statusCode: 400 });
  }

  // All other errors get changed into Boom errors
  if (!Boom.isBoom(err)) {
    Boom.boomify(err);
  }

  return res.status(err.output.statusCode).json(err.output.payload);
};
