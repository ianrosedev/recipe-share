import multer from 'multer';
import path from 'path';

export default multer({
  dest: 'tmp/',
  // Make sure only allowed file types get through
  fileFilter(req, file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Bad file type!'));
  }
}).single('image');
