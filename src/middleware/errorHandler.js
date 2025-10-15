const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err && err.stack ? err.stack : err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};
