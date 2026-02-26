import { logger } from '@core/logging/logger';

/**
 * Wraps an async function with exponential-backoff retry logic.
 * Primarily used for Google Calendar API calls.
 *
 * Retry delays: 200ms → 400ms → 800ms (3 attempts default).
 *
 * @param fn      Async function to retry
 * @param tag     Log context tag (e.g. 'CalendarCreate')
 * @param retries Max number of attempts (default 3)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  tag: string,
  retries = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = 200 * Math.pow(2, attempt - 1); // 200, 400, 800
        logger.warn(tag, `Attempt ${attempt}/${retries} failed — retrying in ${delay}ms`, err);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  logger.error(tag, `All ${retries} attempts failed`, lastError);
  throw lastError;
}
