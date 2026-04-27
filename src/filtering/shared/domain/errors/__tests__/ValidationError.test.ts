import { DomainError } from '../DomainError';
import { ValidationError } from '../ValidationError';

describe('ValidationError', () => {
  it('is an instance of Error', () => {
    const err = new ValidationError('bad input');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of DomainError', () => {
    const err = new ValidationError('bad input');
    expect(err).toBeInstanceOf(DomainError);
  });

  it('is an instance of ValidationError', () => {
    const err = new ValidationError('bad input');
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('preserves the message', () => {
    const err = new ValidationError('field x is invalid');
    expect(err.message).toBe('field x is invalid');
  });

  it('has name "ValidationError"', () => {
    const err = new ValidationError('x');
    expect(err.name).toBe('ValidationError');
  });
});
