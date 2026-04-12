import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencyShortPipe } from './currency-short.pipe';

describe('CurrencyShortPipe', () => {
  let pipe: CurrencyShortPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CurrencyShortPipe] });
    pipe = TestBed.inject(CurrencyShortPipe);
  });

  it('returns $0 for null', () => {
    expect(pipe.transform(null)).toBe('$0');
  });

  it('returns $0 for undefined', () => {
    expect(pipe.transform(undefined)).toBe('$0');
  });

  it('formats values >= 1,000,000 with one decimal and an M suffix', () => {
    expect(pipe.transform(1_500_000)).toBe('$1.5M');
    expect(pipe.transform(2_000_000)).toBe('$2.0M');
  });

  it('formats values >= 1,000 (and < 1,000,000) with one decimal and a K suffix', () => {
    expect(pipe.transform(1_000)).toBe('$1.0K');
    expect(pipe.transform(12_500)).toBe('$12.5K');
    expect(pipe.transform(999_999)).toBe('$1000.0K');
  });

  it('formats values < 1,000 as a whole-dollar amount', () => {
    expect(pipe.transform(0)).toBe('$0');
    expect(pipe.transform(42.7)).toBe('$43');
    expect(pipe.transform(999)).toBe('$999');
  });
});
