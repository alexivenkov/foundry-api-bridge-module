// Limit/offset tolerance policies are part of the wire contract: out-of-range
// values silently fall back to defaults instead of being rejected.

export const SearchInPackLimit = Object.freeze({
  DEFAULT: 50,
  MAX: 500,
  resolve(requested: number | undefined): number {
    if (requested === undefined || requested < 1) return SearchInPackLimit.DEFAULT;
    if (requested > SearchInPackLimit.MAX) return SearchInPackLimit.MAX;
    return requested;
  }
});

// Both cross-pack searches scan every pack in the world until the limit is
// met, so an unbounded limit is a full scan on the GM's main thread. Values
// above MAX are clamped, matching SearchInPackLimit.
export const CrossPackSearchLimit = Object.freeze({
  DEFAULT: 100,
  MAX: 500,
  resolve(requested: number | undefined): number {
    if (requested === undefined || requested < 1) return CrossPackSearchLimit.DEFAULT;
    if (requested > CrossPackSearchLimit.MAX) return CrossPackSearchLimit.MAX;
    return requested;
  }
});

// Journal page matches carry snippets, so the default page-search budget is
// deliberately small.
export const PageSearchLimit = Object.freeze({
  DEFAULT: 25,
  MAX: 200,
  resolve(requested: number | undefined): number {
    if (requested === undefined || requested < 1) return PageSearchLimit.DEFAULT;
    if (requested > PageSearchLimit.MAX) return PageSearchLimit.MAX;
    return requested;
  }
});

export const PageOffset = Object.freeze({
  resolve(requested: number | undefined): number {
    return requested !== undefined && requested >= 0 ? requested : 0;
  }
});
