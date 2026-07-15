import { CrossPackSearchLimit, PageOffset, SearchInPackLimit } from '../resultLimits';

describe('SearchInPackLimit', () => {
  it('defaults to 50 when undefined', () => {
    expect(SearchInPackLimit.resolve(undefined)).toBe(50);
  });

  it('treats values below 1 as default', () => {
    expect(SearchInPackLimit.resolve(0)).toBe(50);
    expect(SearchInPackLimit.resolve(-5)).toBe(50);
  });

  it('caps at 500', () => {
    expect(SearchInPackLimit.resolve(9999)).toBe(500);
  });

  it('passes valid values through', () => {
    expect(SearchInPackLimit.resolve(1)).toBe(1);
    expect(SearchInPackLimit.resolve(500)).toBe(500);
    expect(SearchInPackLimit.resolve(77)).toBe(77);
  });
});

describe('CrossPackSearchLimit', () => {
  it('defaults to 100 when undefined or non-positive', () => {
    expect(CrossPackSearchLimit.resolve(undefined)).toBe(100);
    expect(CrossPackSearchLimit.resolve(0)).toBe(100);
    expect(CrossPackSearchLimit.resolve(-1)).toBe(100);
  });

  it('does not cap positive values', () => {
    expect(CrossPackSearchLimit.resolve(5000)).toBe(5000);
    expect(CrossPackSearchLimit.resolve(3)).toBe(3);
  });
});

describe('PageOffset', () => {
  it('defaults to 0 when undefined or negative', () => {
    expect(PageOffset.resolve(undefined)).toBe(0);
    expect(PageOffset.resolve(-10)).toBe(0);
  });

  it('passes non-negative values through', () => {
    expect(PageOffset.resolve(0)).toBe(0);
    expect(PageOffset.resolve(25)).toBe(25);
  });
});
