import express from 'express';
const app = express();
import connectToDB from './db';
import appMiddleware from './middleware/appMiddleware';
import authRouter from './auth/authRouter';
import apiRouter from './api/apiRouter';

// Connect to DB
connectToDB();

// Middleware setup
appMiddleware(app);

// Route setup
app.use('/auth', authRouter);
app.use('/api/v1', apiRouter);

// Catch errors
app.use((err, req, res, next) => {
  // Handle errors better
  // Just for initial testing
  // Check for server/db specific errors
  // and send generic response and log
  console.log(err.toString());
  res.status(400).json({ error: err.message });
});

export default app;
