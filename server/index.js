import express from 'express';
import config from './config';
import connectToDB from './db';
import appMiddleware from './middleware/appMiddleware';
import errorMiddleware from './middleware/errorMiddleware';
import notFound from './middleware/notFound';
import authRouter from './auth/authRouter';
import apiRouter from './api/apiRouter';

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

// Route not found
app.use(notFound);

// Handle errors
app.use(errorMiddleware);

export default app;
