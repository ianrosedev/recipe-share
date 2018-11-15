import mongoose from 'mongoose';
import config from '../config';

mongoose.Promise = global.Promise;

export default async () => {
  try {
    const connected = await mongoose.connect(config.db.host);

    if (connected === mongoose) {
      console.log('🎉  connected to DB at:', config.db.host);
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
};
