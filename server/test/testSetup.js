import mongoose from 'mongoose';
import MongoMemoryServer from 'mongodb-memory-server'; // eslint-disable-line

// Use native Promises
mongoose.Promise = global.Promise;

// Suppress warnings
mongoose.set('useFindAndModify', true);
mongoose.set('useCreateIndex', true);

let mongoServer;

export const setup = done => {
  mongoServer = new MongoMemoryServer();
  mongoServer
    .getConnectionString()
    .then(mongoUri =>
      mongoose.connect(
        mongoUri,
        { useNewUrlParser: true },
        err => {
          if (err) {
            done(err);
          }
        }
      )
    )
    .then(() => {
      console.log('⚙️  connected to test DB');
      done();
    });
};

export const teardown = () => {
  mongoose.disconnect();
  mongoServer.stop();
};

export const apiV1 = '/api/v1/';
