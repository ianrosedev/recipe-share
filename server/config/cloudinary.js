import cloudinary from 'cloudinary';

// Use node.env with production!
cloudinary.config({
  cloud_name: 'recipe-share',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
