import mongoose from 'mongoose';
import MongoMemoryServer from 'mongodb-memory-server';

let mongoServer;

export const setup = async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getConnectionString();

  await mongoose.connect(
    mongoUri,
    err => err && console.log(err)
  );
};

export const teardown = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const resetDB = () => {
  // Clean up models & schemas
  mongoose.models = {};
  mongoose.modelSchemas = {};
};

export const apiV1 = '/api/v1';
