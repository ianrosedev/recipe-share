import cloudinary from 'cloudinary';
import config from '../config';

cloudinary.config({
  cloud_name: 'recipe-share',
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export default cloudinary;
