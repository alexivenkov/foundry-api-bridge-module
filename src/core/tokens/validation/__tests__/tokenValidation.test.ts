import { ValidationError } from '../../../../kernel';
import {
  createTokenRequestSchema,
  dispositionFromWireCode,
  dispositionToWireCode,
  getTokensInRangeRequestSchema,
  moveTokenRequestSchema,
  nameDisplayFromWireCode,
  setTokenTargetRequestSchema,
  toCreateTokenCommand,
  toGetTokenQuery,
  toListTokensQuery,
  toMoveTokenCommand,
  toSetTokenTargetCommand,
  toTokensInRangeQuery,
  toUpdateTokenCommand,
  updateTokenRequestSchema
} from '..';

describe('token request schemas', () => {
  it('accepts a token with only its actor and position', () => {
    expect(createTokenRequestSchema.safeParse({ actorId: 'a1', x: 0, y: 0 }).success).toBe(true);
  });

  it.each([
    ['no actor', { x: 1, y: 2 }],
    ['no position', { actorId: 'a1' }],
    ['a position given as text', { actorId: 'a1', x: '1', y: 2 }],
    ['a non-boolean hidden flag', { actorId: 'a1', x: 1, y: 2, hidden: 'yes' }]
  ])('rejects a new token with %s', (_case, request) => {
    expect(createTokenRequestSchema.safeParse(request).success).toBe(false);
  });

  it('ignores keys it does not know, such as the x / y the gateway sends with update-token', () => {
    expect(updateTokenRequestSchema.parse({ tokenId: 't1', x: 5, y: 6, hidden: true })).toEqual({
      tokenId: 't1',
      hidden: true
    });
  });

  it('lets sceneId be empty or null, as token commands always have', () => {
    expect(moveTokenRequestSchema.safeParse({ sceneId: null, tokenId: 't1', x: 1, y: 2 }).success).toBe(true);
    expect(moveTokenRequestSchema.safeParse({ sceneId: '', tokenId: 't1', x: 1, y: 2 }).success).toBe(true);
  });

  it('requires the origin and the range for a range query', () => {
    expect(getTokensInRangeRequestSchema.safeParse({ originX: 0, originY: 0 }).success).toBe(false);
    expect(getTokensInRangeRequestSchema.safeParse({ originX: 0, originY: 0, range: 30 }).success).toBe(true);
  });

  it('requires a boolean for the target state', () => {
    expect(setTokenTargetRequestSchema.safeParse({ tokenId: 't1' }).success).toBe(false);
    expect(setTokenTargetRequestSchema.safeParse({ tokenId: 't1', targeted: false }).success).toBe(true);
  });
});

describe('token request mappers', () => {
  it('reads an empty or null sceneId as the active scene', () => {
    expect(toListTokensQuery({ sceneId: '' })).toEqual({ sceneId: undefined });
    expect(toGetTokenQuery({ sceneId: null, tokenId: 't1' })).toEqual({ sceneId: undefined, tokenId: 't1' });
    expect(toListTokensQuery({ sceneId: 's1' })).toEqual({ sceneId: 's1' });
  });

  it('builds a draft from a create request', () => {
    const command = toCreateTokenCommand({ actorId: 'a1', x: 1, y: 2, scale: 2, actorLink: true });

    expect(command.sceneId).toBeUndefined();
    expect(command.draft).toMatchObject({ actorId: 'a1', x: 1, y: 2, scale: 2, actorLink: true });
  });

  it('turns the numeric display mode and disposition of update-token into domain values', () => {
    const command = toUpdateTokenCommand({ tokenId: 't1', displayName: 50, disposition: -1 });

    expect(command.changes.nameDisplay).toBe('always');
    expect(command.changes.disposition).toBe('hostile');
    expect(command.changes.hidden).toBeUndefined();
  });

  it('rejects a display mode or disposition the core does not have', () => {
    expect(() => toUpdateTokenCommand({ tokenId: 't1', displayName: 15 })).toThrow(ValidationError);
    expect(() => toUpdateTokenCommand({ tokenId: 't1', disposition: 5 })).toThrow('Invalid disposition: 5');
  });

  it('animates a move and keeps doors shut unless told otherwise', () => {
    expect(toMoveTokenCommand({ tokenId: 't1', x: 1, y: 2 })).toMatchObject({ animate: true, canOpenDoors: false });
    expect(toMoveTokenCommand({ tokenId: 't1', x: 1, y: 2, animate: false, canOpenDoors: true })).toMatchObject({
      animate: false,
      canOpenDoors: true
    });
  });

  it('releases other targets unless told otherwise', () => {
    expect(toSetTokenTargetCommand({ tokenId: 't1', targeted: true }).releaseOthers).toBe(true);
    expect(toSetTokenTargetCommand({ tokenId: 't1', targeted: true, releaseOthers: false }).releaseOthers).toBe(false);
  });

  it('maps a range query', () => {
    expect(toTokensInRangeQuery({ originX: 1, originY: 2, range: 30, excludeTokenId: 't1' })).toEqual({
      sceneId: undefined,
      originX: 1,
      originY: 2,
      range: 30,
      excludeTokenId: 't1'
    });
  });
});

describe('token wire codes', () => {
  it.each([
    [-2, 'secret'],
    [-1, 'hostile'],
    [0, 'neutral'],
    [1, 'friendly']
  ] as const)('disposition %i is %s, both ways', (code, disposition) => {
    expect(dispositionFromWireCode(code)).toBe(disposition);
    expect(dispositionToWireCode(disposition)).toBe(code);
  });

  it.each([
    [0, 'none'],
    [10, 'control'],
    [20, 'owner-hover'],
    [30, 'hover'],
    [40, 'owner'],
    [50, 'always']
  ] as const)('display mode %i is %s', (code, display) => {
    expect(nameDisplayFromWireCode(code)).toBe(display);
  });
});
