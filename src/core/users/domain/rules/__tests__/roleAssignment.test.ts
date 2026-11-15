import {
  OwnRoleChangeRefusedError,
  PrivilegedUserRoleChangeRefusedError,
  UserRoleNotAssignableError,
  hasUserChanges,
  isPrivilegedRole,
  requireAssignableRole,
  type User
} from '../..';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Ann',
    role: 'player',
    isGM: false,
    isSelf: false,
    active: true,
    color: '#ff0000',
    avatar: null,
    pronouns: null,
    character: null,
    viewedScene: null,
    targetTokenIds: [],
    ...overrides
  };
}

describe('isPrivilegedRole', () => {
  it.each([
    ['none', false],
    ['player', false],
    ['trusted', false],
    ['assistant', true],
    ['gamemaster', true]
  ] as const)('%s → %s', (role, expected) => {
    expect(isPrivilegedRole(role)).toBe(expected);
  });
});

describe('requireAssignableRole', () => {
  it.each(['none', 'player', 'trusted'] as const)('lets a player be given the %s role', (role) => {
    expect(() => requireAssignableRole(user(), role)).not.toThrow();
  });

  it('lets a trusted player be demoted and a banned user be let back in', () => {
    expect(() => requireAssignableRole(user({ role: 'trusted' }), 'player')).not.toThrow();
    expect(() => requireAssignableRole(user({ role: 'none' }), 'player')).not.toThrow();
  });

  it.each(['assistant', 'gamemaster'] as const)('never hands out the %s role', (role) => {
    expect(() => requireAssignableRole(user(), role)).toThrow(
      new UserRoleNotAssignableError(role).message
    );
    expect(() => requireAssignableRole(user(), role)).toThrow(
      `Role '${role}' cannot be assigned through the API; only none, player and trusted can`
    );
  });

  it('never changes the role of the user the module runs as', () => {
    expect(() => requireAssignableRole(user({ isSelf: true, role: 'gamemaster', isGM: true }), 'player')).toThrow(
      OwnRoleChangeRefusedError
    );
    expect(() => requireAssignableRole(user({ isSelf: true }), 'trusted')).toThrow(
      'The role of the user this module runs as cannot be changed through the API'
    );
  });

  it('never takes GM powers from an assistant or a gamemaster', () => {
    expect(() => requireAssignableRole(user({ id: 'a1', role: 'assistant', isGM: true }), 'player')).toThrow(
      'User a1 is an assistant; the role of an assistant or gamemaster cannot be changed through the API'
    );
    expect(() => requireAssignableRole(user({ id: 'g1', role: 'gamemaster', isGM: true }), 'none')).toThrow(
      PrivilegedUserRoleChangeRefusedError
    );
  });

  it('refuses a GM role before looking at the target', () => {
    expect(() => requireAssignableRole(user({ isSelf: true }), 'gamemaster')).toThrow(UserRoleNotAssignableError);
  });
});

describe('hasUserChanges', () => {
  it('is false when every attribute is omitted', () => {
    expect(hasUserChanges({ name: undefined, role: undefined })).toBe(false);
  });

  it('counts null as a change', () => {
    expect(hasUserChanges({ characterId: null })).toBe(true);
  });
});
