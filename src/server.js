const { createServer } = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const app = createServer();

const server = app.listen(config.PORT, () => {
  logger.info(`Server started on port ${config.PORT}`);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
