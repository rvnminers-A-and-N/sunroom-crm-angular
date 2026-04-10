import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './testing/msw/server';

// Start the MSW server before all tests, reset handlers after each test, and
// shut it down once the suite finishes. The Angular builder bootstraps the
// Angular TestBed automatically before this file runs, so it's safe to import
// MSW and jest-dom matchers here.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});
