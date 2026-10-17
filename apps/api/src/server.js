import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

async function startServer() {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`Web Memory API running in ${config.nodeEnv} mode on port ${config.port}`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
