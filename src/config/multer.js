const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Resolve the absolute path to /public/uploads from /src/config
const uploadDir = path.join(__dirname, '../../public/uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
