import convict from 'convict';

const config = convict({
  env: {
    doc: 'The application environment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 3001,
    env: 'PORT',
    arg: 'port',
  },
  db: {
    host: {
      doc: 'Database host name/IP',
      format: '*',
      default: 'mongodb://localhost:27017/recipeShareDev',
      env: 'DB_HOST',
      arg: 'dbHost',
    },
  },
  jwt: {
    secret: {
      doc: 'JSON web token secret',
      format: String,
      default: '',
      env: 'JWT_SECRET',
      sensitive: true,
    },
    expireTime: {
      doc: 'JSON web token expiration time',
      format: String,
      default: '7d',
      env: 'JWT_EXPIRE_TIME',
      arg: 'jwtExpireTime',
    },
  },
  mail: {
    clientID: {
      doc: 'Google client ID',
      format: String,
      default: '',
      env: 'MAIL_CLIENT_ID',
      sensitive: true,
    },
    clientSecret: {
      doc: 'Google client secret',
      format: String,
      default: '',
      env: 'MAIL_CLIENT_SECRET',
      sensitive: true,
    },
    refreshToken: {
      doc: 'Google refresh token',
      format: String,
      default: '',
      env: 'MAIL_REFRESH_TOKEN',
      sensitive: true,
    },
  },
  cloudinary: {
    apiKey: {
      doc: 'Cloudinary API key',
      format: String,
      default: '',
      env: 'CLOUDINARY_API_KEY',
      sensitive: true,
    },
    apiSecret: {
      doc: 'Cloudinary API secret',
      format: String,
      default: '',
      env: 'CLOUDINARY_API_SECRET',
      sensitive: true,
    },
  },
});

const env = config.get('env');
config.loadFile(`${__dirname}/${env}.json`);
config.validate({ allowed: 'strict' });

console.log('🌴  environment:', env);

export default config.getProperties();
