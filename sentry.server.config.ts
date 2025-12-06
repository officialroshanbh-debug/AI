import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env';

Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
});
