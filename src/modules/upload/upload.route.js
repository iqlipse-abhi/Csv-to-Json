const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const config = require('../../config');
const uploadController = require('./upload.controller');

const router = express.Router();

// To chk if uploads dir exists
if (!fs.existsSync(config.CSV_INPUT_FOLDER)) {
  fs.mkdirSync(config.CSV_INPUT_FOLDER, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.CSV_INPUT_FOLDER),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/i)) {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  }
});

router.post('/file', upload.single('file'), uploadController.uploadFile);

module.exports = router;
