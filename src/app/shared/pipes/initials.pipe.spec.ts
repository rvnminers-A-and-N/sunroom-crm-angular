import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { InitialsPipe } from './initials.pipe';

describe('InitialsPipe', () => {
  let pipe: InitialsPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [InitialsPipe] });
    pipe = TestBed.inject(InitialsPipe);
  });

  it('returns ? for null', () => {
    expect(pipe.transform(null)).toBe('?');
  });

  it('returns ? for undefined', () => {
    expect(pipe.transform(undefined)).toBe('?');
  });

  it('returns ? for an empty string', () => {
    expect(pipe.transform('')).toBe('?');
  });

  it('returns the uppercase first letter for a single word', () => {
    expect(pipe.transform('ada')).toBe('A');
  });

  it('returns the first letters of the first two words uppercased', () => {
    expect(pipe.transform('ada lovelace')).toBe('AL');
  });

  it('truncates to two characters when more than two words are supplied', () => {
    expect(pipe.transform('Ada B Lovelace')).toBe('AB');
  });
});
