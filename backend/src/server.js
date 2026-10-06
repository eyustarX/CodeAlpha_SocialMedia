const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(` Server running in [${config.nodeEnv}] mode`);
  console.log(` Listening on port: http://localhost:${config.port}`);
  console.log(` Health check: http://localhost:${config.port}/health`);
  console.log(`=========================================`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
