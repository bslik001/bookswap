import { initSentry } from './config/sentry';

initSentry();

import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'BookSwap API demarree');
});

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Arret en cours...');

  const forceExit = setTimeout(() => {
    logger.error('Arret force : timeout depasse');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Erreur lors de la fermeture du serveur HTTP');
    }
    try {
      await prisma.$disconnect();
      logger.info('Base de donnees deconnectee. Bye.');
      process.exit(err ? 1 : 0);
    } catch (e) {
      logger.error({ err: e }, 'Erreur lors de la deconnexion Prisma');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
