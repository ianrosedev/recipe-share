import mongoose from 'mongoose';
import appConfig from '../config';

mongoose.Promise = global.Promise;

export default async (config = appConfig) => {
  try {
    const connected = await mongoose.connect(config.db.url);

    if (connected === mongoose) {
      console.log('🎉  connected to DB at:', appConfig.db.url);
    }
  }
  catch (err) {
    console.log('ERROR:', err.message);
  }
};
