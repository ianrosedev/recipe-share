import mongoose from 'mongoose';
import toJson from '@meanie/mongoose-to-json';
import config from '../config';

// Use native Promises
mongoose.Promise = global.Promise;

// Suppress warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Change response `_id`->`id` and remove `__v`
mongoose.plugin(toJson);

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
