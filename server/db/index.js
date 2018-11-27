import mongoose from 'mongoose';
import config from '../config';

// Use native Promises
mongoose.Promise = global.Promise;

// Suppress warnings
mongoose.set('useFindAndModify', true);
mongoose.set('useCreateIndex', true);

export default async () => {
  try {
    const connected = await mongoose.connect(
      config.db.host,
      // Suppress warnings
      { useNewUrlParser: true }
    );

    if (connected === mongoose) {
      console.log('🎉  connected to DB at:', config.db.host);
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
};
