/**
 * Next.js Instrumentation Hook — runs exactly once per server startup.
 *
 * This is the official Next.js mechanism for running code before the server
 * begins handling requests. It fires in the Node.js runtime only (not Edge).
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * We use it to:
 *   - Register all tools into the automation tool registry
 *   - Wire up cross-module domain event listeners
 *
 * Dynamic import is required because instrumentation.ts runs before the
 * Next.js module graph is fully initialized.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeApp } = await import('./src/app/init');
    initializeApp();
  }
}
