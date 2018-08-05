import app from './server';
import config from './server/config';

app.listen(config.port, () => {
  console.log('🚀  server is on port:', config.port);
});
