const multer = require("multer");
const path = require("path");

// Configure memory storage (files are stored in buffer, not written to disk)
const storage = multer.memoryStorage();


// File filter: accept zip files only
const fileFilter = (req, file, cb) => {
  const filetypes = /zip/;
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/x-zip-compressed' || file.mimetype === 'application/zip';
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  }
  return cb(new Error("Only .zip files are allowed!"), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Limit file size to 50MB
  }
});

module.exports = upload;
