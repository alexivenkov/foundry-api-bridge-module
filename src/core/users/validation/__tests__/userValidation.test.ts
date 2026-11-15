import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  getUserRequestSchema,
  getUsersRequestSchema,
  toGetUserQuery,
  toListUsersQuery,
  toUpdateUserCommand,
  updateUserRequestSchema
} from '..';

describe('user request schemas', () => {
  it('defaults activeOnly to false', () => {
    expect(toListUsersQuery(parseRequest(getUsersRequestSchema, {}))).toEqual({ activeOnly: false });
    expect(toListUsersQuery(parseRequest(getUsersRequestSchema, { activeOnly: true }))).toEqual({ activeOnly: true });
  });

  it('rejects a non-boolean activeOnly', () => {
    expect(() => parseRequest(getUsersRequestSchema, { activeOnly: 'yes' })).toThrow(ValidationError);
  });

  it('requires a non-empty userId', () => {
    expect(toGetUserQuery(parseRequest(getUserRequestSchema, { userId: 'u1', extra: 1 }))).toEqual({ userId: 'u1' });
    expect(() => parseRequest(getUserRequestSchema, {})).toThrow(ValidationError);
    expect(() => parseRequest(getUserRequestSchema, { userId: '' })).toThrow(ValidationError);
  });

  it('maps a full update', () => {
    const request = parseRequest(updateUserRequestSchema, {
      userId: 'u1',
      name: '  Annie ',
      color: '#00AA11',
      pronouns: 'she/her',
      characterId: 'hero',
      role: 'trusted'
    });

    expect(toUpdateUserCommand(request)).toEqual({
      userId: 'u1',
      changes: { name: 'Annie', color: '#00AA11', pronouns: 'she/her', characterId: 'hero', role: 'trusted' }
    });
  });

  it('keeps omitted fields absent and reads null / empty pronouns as clearing them', () => {
    expect(toUpdateUserCommand(parseRequest(updateUserRequestSchema, { userId: 'u1', pronouns: '' })).changes).toEqual({
      name: undefined,
      color: undefined,
      pronouns: null,
      characterId: undefined,
      role: undefined
    });
    expect(
      toUpdateUserCommand(parseRequest(updateUserRequestSchema, { userId: 'u1', pronouns: null, characterId: null }))
        .changes
    ).toMatchObject({ pronouns: null, characterId: null });
  });

  it.each([
    ['a blank name', { name: '   ' }],
    ['a short hex color, which the core would rewrite', { color: '#0f0' }],
    ['a color name', { color: 'red' }],
    ['an unknown role', { role: 'admin' }],
    ['a numeric role', { role: 1 }],
    ['an empty character id', { characterId: '' }],
    ['a non-string name', { name: 5 }]
  ])('rejects %s', (_label, params) => {
    expect(() => parseRequest(updateUserRequestSchema, { userId: 'u1', ...params })).toThrow(ValidationError);
  });

  it('accepts the GM roles at the schema level so the domain can explain the refusal', () => {
    expect(parseRequest(updateUserRequestSchema, { userId: 'u1', role: 'gamemaster' }).role).toBe('gamemaster');
  });
});
