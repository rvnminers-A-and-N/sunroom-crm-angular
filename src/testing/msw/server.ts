import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * The MSW node server used by the Vitest test environment.
 *
 * Tests can call `server.use(...)` to override or add handlers per test, and
 * `server.resetHandlers()` (called automatically in `test-setup.ts`) restores
 * the default set between tests.
 */
export const server = setupServer(...handlers);
