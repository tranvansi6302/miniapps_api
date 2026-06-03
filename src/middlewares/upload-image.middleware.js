const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

// File filter: accept images only
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp|svg/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  return cb(new Error("Only images (.png, .jpg, .jpeg, .gif, .webp, .svg) are allowed!"), false);
};

const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit image size to 10MB
  }
});

module.exports = uploadImage;
