const path = require('path');
const fs = require('fs');
const asyncHandler = require('../../middleware/asyncHandler');
const uploadService = require('./upload.service');

exports.uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file required (form key: file)' });
  }

  const filepath = path.resolve(req.file.path);
  console.log(`Received file: ${filepath}`);

  try {
    const result = await uploadService.processFile(filepath);

    try { fs.unlinkSync(filepath); } catch (e) { console.warn('Failed to delete file', e); }

    res.json({
      message: 'File processed',
      total: result.total,
      ageDistribution: result.ageDistribution
    });

  } catch (err) {
    try { fs.unlinkSync(filepath); } catch (e) {}
    console.error('Error processing file:', err);
    throw err;
  }
});
