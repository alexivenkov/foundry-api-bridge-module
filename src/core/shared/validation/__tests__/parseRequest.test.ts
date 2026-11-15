import { z } from 'zod';
import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../parseRequest';

const schema = z.object({ wallId: z.string(), state: z.number().optional() });

describe('parseRequest', () => {
  it('returns the parsed request and drops unknown keys', () => {
    expect(parseRequest(schema, { wallId: 'w1', extra: true })).toEqual({ wallId: 'w1' });
  });

  it('rejects an invalid request with the field path in the message', () => {
    const act = (): unknown => parseRequest(schema, { wallId: 5 });

    expect(act).toThrow(ValidationError);
    expect(act).toThrow(/^wallId: /);
  });

  it('rejects a request that is not an object', () => {
    expect(() => parseRequest(schema, undefined)).toThrow(ValidationError);
  });
});
