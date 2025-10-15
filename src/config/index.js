const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  CSV_INPUT_FOLDER: process.env.CSV_INPUT_FOLDER || './uploads',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '500', 10),
  MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10)
};
