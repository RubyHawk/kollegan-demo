/**
 * Development-only login endpoint. The handler returns 404 in production.
 */

export { handleDevLogin as GET } from '@modules/supporting/auth';
