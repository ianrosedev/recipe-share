import mongoose from 'mongoose';
import config from '../config';

mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', true);
mongoose.set('useCreateIndex', true);

export default async () => {
  try {
    const connected = await mongoose.connect(
      config.db.host,
      { useNewUrlParser: true }
    );

    if (connected === mongoose) {
      console.log('🎉  connected to DB at:', config.db.host);
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
};
