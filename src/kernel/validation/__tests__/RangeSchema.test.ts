import { makeRangeSchema } from '../RangeSchema';

describe('makeRangeSchema', () => {
  describe('default options', () => {
    const schema = makeRangeSchema();

    it('accepts both min and max', () => {
      const r = schema.safeParse({ min: 5, max: 10 });
      expect(r.success).toBe(true);
    });

    it('accepts only min', () => {
      const r = schema.safeParse({ min: 5 });
      expect(r.success).toBe(true);
    });

    it('accepts only max', () => {
      const r = schema.safeParse({ max: 10 });
      expect(r.success).toBe(true);
    });

    it('rejects empty object (must specify at least one bound)', () => {
      const r = schema.safeParse({});
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues[0]?.message).toBe('range must specify at least min or max');
    });

    it('rejects min > max with substituted values in message', () => {
      const r = schema.safeParse({ min: 14, max: 10 });
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues[0]?.message).toBe('min (14) must be <= max (10)');
    });

    it('accepts min equal to max', () => {
      const r = schema.safeParse({ min: 7, max: 7 });
      expect(r.success).toBe(true);
    });

    it('rejects non-number types for min', () => {
      const r = schema.safeParse({ min: 'abc' });
      expect(r.success).toBe(false);
    });

    it('rejects non-number types for max', () => {
      const r = schema.safeParse({ max: 'abc' });
      expect(r.success).toBe(false);
    });

    it('rejects NaN for min', () => {
      const r = schema.safeParse({ min: Number.NaN });
      expect(r.success).toBe(false);
    });

    it('rejects NaN for max', () => {
      const r = schema.safeParse({ max: Number.NaN });
      expect(r.success).toBe(false);
    });

    it('accepts negative numbers by default', () => {
      const r = schema.safeParse({ min: -5, max: 5 });
      expect(r.success).toBe(true);
    });

    it('accepts fractional numbers by default', () => {
      const r = schema.safeParse({ min: 0.5, max: 1.5 });
      expect(r.success).toBe(true);
    });
  });

  describe('integerOnly: true', () => {
    const schema = makeRangeSchema({ integerOnly: true });

    it('accepts integer min', () => {
      expect(schema.safeParse({ min: 5 }).success).toBe(true);
    });

    it('rejects fractional min', () => {
      const r = schema.safeParse({ min: 5.5 });
      expect(r.success).toBe(false);
    });

    it('rejects fractional max', () => {
      const r = schema.safeParse({ max: 5.5 });
      expect(r.success).toBe(false);
    });

    it('accepts integer min and max', () => {
      expect(schema.safeParse({ min: 1, max: 10 }).success).toBe(true);
    });
  });

  describe('minBound: 0 (inclusive)', () => {
    const schema = makeRangeSchema({ minBound: 0 });

    it('accepts min === 0', () => {
      expect(schema.safeParse({ min: 0 }).success).toBe(true);
    });

    it('accepts max === 0', () => {
      expect(schema.safeParse({ max: 0 }).success).toBe(true);
    });

    it('rejects negative min', () => {
      expect(schema.safeParse({ min: -1 }).success).toBe(false);
    });

    it('rejects negative max', () => {
      expect(schema.safeParse({ max: -1 }).success).toBe(false);
    });

    it('accepts positive values', () => {
      expect(schema.safeParse({ min: 5, max: 10 }).success).toBe(true);
    });
  });

  describe('allowedValues: [0, 0.125, 0.25, 0.5, 1]', () => {
    const allowed = [0, 0.125, 0.25, 0.5, 1] as const;
    const schema = makeRangeSchema({ allowedValues: allowed });

    it('accepts an allowed min value', () => {
      expect(schema.safeParse({ min: 0.25 }).success).toBe(true);
    });

    it('accepts an allowed max value', () => {
      expect(schema.safeParse({ max: 0.5 }).success).toBe(true);
    });

    it('rejects a disallowed min value', () => {
      const r = schema.safeParse({ min: 0.7 });
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues[0]?.message).toBe(
        'must be one of allowed values: 0, 0.125, 0.25, 0.5, 1'
      );
    });

    it('rejects a disallowed max value', () => {
      expect(schema.safeParse({ max: 0.7 }).success).toBe(false);
    });

    it('attaches the path of the failing field to the issue', () => {
      const r = schema.safeParse({ min: 0.7 });
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues[0]?.path).toEqual(['min']);
    });
  });

  describe('combined options', () => {
    it('integerOnly + minBound rejects negative integer', () => {
      const schema = makeRangeSchema({ integerOnly: true, minBound: 0 });
      expect(schema.safeParse({ min: -1 }).success).toBe(false);
    });

    it('integerOnly + minBound rejects fractional within range', () => {
      const schema = makeRangeSchema({ integerOnly: true, minBound: 0 });
      expect(schema.safeParse({ min: 0.5 }).success).toBe(false);
    });

    it('integerOnly + minBound accepts non-negative integer', () => {
      const schema = makeRangeSchema({ integerOnly: true, minBound: 0 });
      expect(schema.safeParse({ min: 0, max: 30 }).success).toBe(true);
    });

    it('allowedValues + min > max yields the cross-field error', () => {
      const schema = makeRangeSchema({ allowedValues: [0, 0.25, 0.5, 1] });
      const r = schema.safeParse({ min: 1, max: 0.25 });
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues[0]?.message).toBe('min (1) must be <= max (0.25)');
    });

    it('allowedValues with empty object still requires at least one bound', () => {
      const schema = makeRangeSchema({ allowedValues: [0, 1] });
      const r = schema.safeParse({});
      expect(r.success).toBe(false);
      if (r.success) return;
      expect(r.error.issues[0]?.message).toBe('range must specify at least min or max');
    });
  });

  describe('inferred output type', () => {
    it('produces an object with optional min and max numbers', () => {
      const schema = makeRangeSchema();
      const r = schema.safeParse({ min: 5, max: 10 });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.min).toBe(5);
      expect(r.data.max).toBe(10);
    });

    it('omits absent fields in the parsed data', () => {
      const schema = makeRangeSchema();
      const r = schema.safeParse({ min: 5 });
      expect(r.success).toBe(true);
      if (!r.success) return;
      expect(r.data.min).toBe(5);
      expect(r.data.max).toBeUndefined();
    });
  });
});
