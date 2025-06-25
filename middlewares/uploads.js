// middlewares/uploads.js
const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // or 'public/uploads' or wherever you want to save
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  }
});

// File filter (optional: limit types like pdf, jpg etc.)
const fileFilter = (req, file, cb) => {
  cb(null, true); // Allow all files for now
};

// Create the multer upload object
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

module.exports = upload; // ✅ IMPORTANT: export the multer instance
