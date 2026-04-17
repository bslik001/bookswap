import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

let enabled = false;

export const initSentry = (): void => {
  if (!env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  });

  enabled = true;
  logger.info({ env: env.NODE_ENV }, 'Sentry initialise');
};

export const isSentryEnabled = (): boolean => enabled;

export { Sentry };
