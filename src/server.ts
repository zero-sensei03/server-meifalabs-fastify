import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main(): Promise<void> {
  const app = await buildApp();
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;

    shuttingDown = true;
    app.log.info({ signal }, 'Graceful shutdown started');

    const timeout = setTimeout(() => {
      app.log.error('Graceful shutdown timed out');
      process.exit(1);
    }, 10_000);

    timeout.unref();

    try {
      await app.close();
      clearTimeout(timeout);
      app.log.info('Server stopped cleanly');
    } catch (error) {
      clearTimeout(timeout);
      app.log.error({ err: error }, 'Graceful shutdown failed');
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    const address = await app.listen({
      host: env.host,
      port: env.port,
    });

    app.log.info({ address }, 'Server started');
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start server');
    process.exitCode = 1;
    await app.close();
  }
}

void main();
