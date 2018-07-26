import { json } from 'express';

const appMiddleware = (app) => {
  // Parse JSON request body
  app.use(json());
};

export default appMiddleware;
