import { json } from 'express';
import morgan from 'morgan';
import config from '../config';

export default app => {
  // Parse JSON request body
  app.use(json());

  // Log HTTP requests
  if (config.env !== 'production') {
    app.use(morgan('dev'));
  }
};
