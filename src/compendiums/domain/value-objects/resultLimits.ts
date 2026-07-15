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

export const CrossPackSearchLimit = Object.freeze({
  DEFAULT: 100,
  resolve(requested: number | undefined): number {
    return requested !== undefined && requested > 0
      ? requested
      : CrossPackSearchLimit.DEFAULT;
  }
});

// Journal page matches carry snippets, so the default page-search budget is
// deliberately small.
export const PageSearchLimit = Object.freeze({
  DEFAULT: 25,
  resolve(requested: number | undefined): number {
    return requested !== undefined && requested > 0
      ? requested
      : PageSearchLimit.DEFAULT;
  }
});

export const PageOffset = Object.freeze({
  resolve(requested: number | undefined): number {
    return requested !== undefined && requested >= 0 ? requested : 0;
  }
});
