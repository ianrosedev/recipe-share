import multer from 'multer';
import path from 'path';
import Boom from 'boom';

// Adds file to request object -> req.file
export const uploadImage = multer({
  dest: 'tmp/',
  // Make sure only allowed file types get through
  fileFilter(req, file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      // Success
      return cb(null, true);
    }

    // Error
    cb(Boom.badRequest('Bad File Type'));
  },
}).single('image');
