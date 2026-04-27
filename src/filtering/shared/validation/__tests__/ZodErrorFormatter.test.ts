import { z } from 'zod';
import { formatZodError } from '../ZodErrorFormatter';

describe('formatZodError', () => {
  it('returns the issue message when path is empty (root-level)', () => {
    const schema = z.string().min(1, 'must be non-empty after trim');
    const result = schema.safeParse('');
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatZodError(result.error)).toBe('must be non-empty after trim');
  });

  it('prefixes the path for a top-level object field', () => {
    const schema = z.object({ limit: z.number() });
    const result = schema.safeParse({ limit: 'abc' });
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    expect(formatted.startsWith('limit:')).toBe(true);
    expect(formatted).toContain('limit: ');
  });

  it('joins nested paths with dot separator', () => {
    const schema = z.object({
      abilities: z.object({ str: z.number() })
    });
    const result = schema.safeParse({ abilities: { str: 'wrong' } });
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    expect(formatted.startsWith('abilities.str:')).toBe(true);
  });

  it('returns only the message for empty array path (array-level error)', () => {
    const schema = z.array(z.string()).nonempty('type array must not be empty');
    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatZodError(result.error)).toBe('type array must not be empty');
  });

  it('formats array element index in path', () => {
    const schema = z.array(z.number());
    const result = schema.safeParse([1, 'abc', 3]);
    expect(result.success).toBe(false);
    if (result.success) return;
    const formatted = formatZodError(result.error);
    expect(formatted.startsWith('1:')).toBe(true);
  });

  it('returns only the first issue when multiple exist', () => {
    const schema = z.object({
      a: z.number(),
      b: z.number()
    });
    const result = schema.safeParse({ a: 'x', b: 'y' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
    const formatted = formatZodError(result.error);
    // Should be only one line, mentioning either 'a' or 'b' (Zod returns 'a' first in object order)
    expect(formatted.split('\n')).toHaveLength(1);
    expect(formatted.startsWith('a:')).toBe(true);
  });

  it('handles refine-based custom message at root with no path', () => {
    const schema = z
      .object({ min: z.number().optional(), max: z.number().optional() })
      .refine(
        (v) => v.min !== undefined || v.max !== undefined,
        { message: 'range must specify at least min or max' }
      );
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatZodError(result.error)).toBe('range must specify at least min or max');
  });

  it('preserves substituted values in the issue message (e.g., min/max)', () => {
    const schema = z
      .object({ min: z.number().optional(), max: z.number().optional() })
      .superRefine((v, ctx) => {
        if (v.min !== undefined && v.max !== undefined && v.min > v.max) {
          ctx.addIssue({
            code: 'custom',
            message: `min (${String(v.min)}) must be <= max (${String(v.max)})`,
            path: []
          });
        }
      });
    const result = schema.safeParse({ min: 14, max: 10 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatZodError(result.error)).toBe('min (14) must be <= max (10)');
  });

  it('returns empty string when there are no issues (defensive)', () => {
    // Construct an empty ZodError manually via parsing trick: this is defensive only.
    const schema = z.string();
    const result = schema.safeParse('ok');
    expect(result.success).toBe(true);
    // formatter is intended to be used only on failure; build a fake empty error
    const fakeError = { issues: [] } as unknown as z.ZodError;
    expect(formatZodError(fakeError)).toBe('');
  });
});
