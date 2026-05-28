const multer = require("multer");
const path = require("path");

// Configure storage location and file naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const appId = req.body.app_id || "app";
    // Clean app_id: keep letters, numbers, dots, dashes, underscores
    const cleanAppId = appId.replace(/[^a-zA-Z0-9.-_]/g, "");
    
    const version = req.body.version || "1.0.0";
    const cleanVersion = version.replace(/[^0-9.]/g, "");
    
    const timestamp = Math.round(Date.now() / 1000);
    const ext = path.extname(file.originalname);
    cb(null, `${cleanAppId}_v${cleanVersion}_${timestamp}${ext}`);
  }
});

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
