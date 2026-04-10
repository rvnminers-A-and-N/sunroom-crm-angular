import { describe, it, expect } from 'vitest';
import { server } from './msw/server';
import { makeContact, makeUser } from './fixtures';

/**
 * Smoke test that proves the test harness boots: Vitest runs, the Angular
 * builder bootstraps TestBed, jest-dom matchers are registered, MSW is up,
 * and the fixture builders return well-typed data. Specs in subsequent
 * branches will replace this minimal coverage.
 */
describe('test harness sanity check', () => {
  it('runs vitest', () => {
    expect(true).toBe(true);
  });

  it('boots the MSW server', () => {
    expect(server).toBeDefined();
  });

  it('produces deterministic fixtures', () => {
    expect(makeUser({ name: 'Bob' }).name).toBe('Bob');
    expect(makeContact().firstName).toBe('Ada');
  });
});
