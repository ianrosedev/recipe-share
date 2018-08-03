import app from './server';
import config from './server/config';

app.listen(config.port, () => {
  console.log('🚀  listening on port:', config.port);
});
