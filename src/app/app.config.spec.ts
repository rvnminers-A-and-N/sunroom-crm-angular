import { describe, it, expect } from 'vitest';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('exposes a non-empty providers array', () => {
    expect(Array.isArray(appConfig.providers)).toBe(true);
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('is importable as the application configuration object', async () => {
    const mod = await import('./app.config');
    expect(mod.appConfig).toBe(appConfig);
  });
});
