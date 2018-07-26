import express from 'express';
const app = express();
import appMiddleware from './middleware/appMiddleware';
import authRouter from './auth/router';
import apiRouter from './api/api';

// Middleware setup
appMiddleware(app);

// Route setup
app.use('/auth', authRouter);
app.use('/api/v1', apiRouter);

export default app;
