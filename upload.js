// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Ensure "uploads/" folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
    cb(null, true);
  }
});

module.exports = upload;

