import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;
  const NOW = new Date('2025-06-15T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    TestBed.configureTestingModule({ providers: [RelativeTimePipe] });
    pipe = TestBed.inject(RelativeTimePipe);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function ago(ms: number): string {
    return new Date(NOW - ms).toISOString();
  }

  it('returns an empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('returns "just now" for timestamps less than a minute old', () => {
    expect(pipe.transform(ago(30 * 1000))).toBe('just now');
  });

  it('returns "Nm ago" for timestamps less than an hour old', () => {
    expect(pipe.transform(ago(5 * 60 * 1000))).toBe('5m ago');
  });

  it('returns "Nh ago" for timestamps less than a day old', () => {
    expect(pipe.transform(ago(3 * 60 * 60 * 1000))).toBe('3h ago');
  });

  it('returns "Nd ago" for timestamps less than a week old', () => {
    expect(pipe.transform(ago(2 * 24 * 60 * 60 * 1000))).toBe('2d ago');
  });

  it('returns "Nw ago" for timestamps less than 30 days old', () => {
    expect(pipe.transform(ago(14 * 24 * 60 * 60 * 1000))).toBe('2w ago');
  });

  it('returns the locale date string for timestamps 30 days old or more', () => {
    const old = ago(45 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(old)).toBe(new Date(old).toLocaleDateString());
  });
});
