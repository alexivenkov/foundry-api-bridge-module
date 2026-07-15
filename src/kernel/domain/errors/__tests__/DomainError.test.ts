import { DomainError } from '../DomainError';

describe('DomainError', () => {
  it('is an instance of Error', () => {
    const err = new DomainError('boom');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of DomainError', () => {
    const err = new DomainError('boom');
    expect(err).toBeInstanceOf(DomainError);
  });

  it('preserves the message', () => {
    const err = new DomainError('something wrong');
    expect(err.message).toBe('something wrong');
  });

  it('has name "DomainError"', () => {
    const err = new DomainError('x');
    expect(err.name).toBe('DomainError');
  });

  it('has working stack trace', () => {
    const err = new DomainError('x');
    expect(typeof err.stack).toBe('string');
  });
});
