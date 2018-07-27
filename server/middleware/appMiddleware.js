import { json } from 'express';
import morgan from 'morgan';

const appMiddleware = (app) => {
  // Parse JSON request body
  app.use(json());

  // Log HTTP requests
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }
};

export default appMiddleware;
