import express from 'express';
import connectToDB from './db';
import appMiddleware from './middleware/appMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import authRouter from './auth/authRouter';
import apiRouter from './api/apiRouter';
import config from './config';

const app = express();

// Connect to DB
if (config.env !== 'test') {
  connectToDB();
}

// Middleware setup
appMiddleware(app);

// Route setup
app.use('/auth', authRouter);
app.use('/api/v1', apiRouter);

// Handle errors
app.use(errorMiddleware);

export default app;
