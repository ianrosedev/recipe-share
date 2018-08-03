import express from 'express';
const app = express();
import connectToDB from './db';
import appMiddleware from './middleware/appMiddleware';
import authRouter from './auth/router';
import apiRouter from './api/api';

// Connect to DB
connectToDB();

// Middleware setup
appMiddleware(app);

// Route setup
app.use('/auth', authRouter);
app.use('/api/v1', apiRouter);

// Catch errors
app.use((err, req, res, next) => {
  // Handle error better
  // Just for initial testing
  res.status(400).json(err);
});

export default app;
