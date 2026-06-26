import { parseMapIncrease } from '../MapIncrease';
import { ValidationError } from '@/systems/shared/domain/errors';

describe('parseMapIncrease', () => {
  it('accepts 0, 1 and 2', () => {
    expect(parseMapIncrease(0)).toBe(0);
    expect(parseMapIncrease(1)).toBe(1);
    expect(parseMapIncrease(2)).toBe(2);
  });

  it('rejects out-of-range values', () => {
    expect(() => parseMapIncrease(3)).toThrow(ValidationError);
    expect(() => parseMapIncrease(-1)).toThrow(ValidationError);
  });
});
