/**
 * Sentry configuration for the agent
 */

import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

export function initializeSentry(): void {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Environment
      environment: SENTRY_ENVIRONMENT,

      // Tracing
      tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

      // Performance Monitoring
      enableTracing: true,

      // Before send hook for filtering
      beforeSend(event, hint) {
        // Filter out development errors
        if (SENTRY_ENVIRONMENT === 'development') {
          console.log('Sentry event (development):', event);
          return null; // Don't send in development
        }
        return event;
      },

      // Add context
      initialScope: {
        tags: {
          runtime: 'node',
          service: 'agent',
        },
      },
    });

    console.log('✅ Sentry initialized for agent');
  } else {
    console.warn('⚠️  Sentry DSN not configured. Error tracking is disabled.');
  }
}

// Export Sentry for manual error tracking
export { Sentry };
