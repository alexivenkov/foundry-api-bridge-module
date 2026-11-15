import { FoundryUserDirectory } from '../FoundryUserDirectory';
import type { FoundryUser, FoundryUserGlobals } from '../foundryUserTypes';
import { roleFromCode, roleToCode } from '../userRoleCodes';

// Shapes as the client User shows them on 13.351 / 14.368: `color` is a Color
// (Number subclass with `css`), `character` resolves through game.actors,
// `avatar` is already prepared, `targets` is a Set of placeables with `ids`.
class FakeTargets extends Set<{ id: string }> {
  get ids(): string[] {
    return Array.from(this, (token) => token.id);
  }
}

const PERMISSIONS = { ACTOR_CREATE: {}, MACRO_SCRIPT: {}, PING_CANVAS: {} };

interface Fixture {
  globals: FoundryUserGlobals;
  users: Map<string, FoundryUser>;
}

function foundryUser(overrides: Partial<FoundryUser> = {}): FoundryUser {
  return {
    id: 'ann',
    name: 'Ann',
    role: 1,
    isGM: false,
    active: true,
    color: { css: '#ff0000' },
    avatar: 'hero.webp',
    pronouns: 'she/her',
    character: { id: 'hero', name: 'Hero' },
    viewedScene: 'keep',
    targets: new FakeTargets([{ id: 't1' }, { id: 't2' }]),
    hasPermission: (permission) => permission !== 'ACTOR_CREATE',
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function fixture(list: FoundryUser[]): Fixture {
  const users = new Map(list.map((u) => [u.id, u]));
  const globals: FoundryUserGlobals = {
    game: {
      users: { get: (id) => users.get(id), get contents() { return [...users.values()]; } },
      userId: 'gm',
      actors: { get: (id) => (id === 'hero' ? { id } : undefined) },
      scenes: { get: (id) => (id === 'keep' ? { id: 'keep', name: 'Keep' } : undefined) }
    },
    CONST: { USER_PERMISSIONS: PERMISSIONS }
  };
  return { globals, users };
}

function directoryFor(list: FoundryUser[]): { directory: FoundryUserDirectory; users: Map<string, FoundryUser> } {
  const { globals, users } = fixture(list);
  return { directory: new FoundryUserDirectory(() => globals), users };
}

describe('userRoleCodes', () => {
  it('maps the verified CONST.USER_ROLES codes both ways', () => {
    expect([0, 1, 2, 3, 4].map((code) => roleFromCode(code, code >= 3))).toEqual([
      'none',
      'player',
      'trusted',
      'assistant',
      'gamemaster'
    ]);
    expect(roleToCode('trusted')).toBe(2);
  });

  it('never reads an unknown code as a role below assistant for a GM', () => {
    expect(roleFromCode(9, true)).toBe('gamemaster');
    expect(roleFromCode(9, false)).toBe('none');
  });
});

describe('FoundryUserDirectory', () => {
  it('maps a client user to the snapshot', () => {
    const { directory } = directoryFor([foundryUser()]);

    expect(directory.findUser('ann')).toEqual({
      id: 'ann',
      name: 'Ann',
      role: 'player',
      isGM: false,
      isSelf: false,
      active: true,
      color: '#ff0000',
      avatar: 'hero.webp',
      pronouns: 'she/her',
      character: { id: 'hero', name: 'Hero' },
      viewedScene: { id: 'keep', name: 'Keep' },
      targetTokenIds: ['t1', 't2']
    });
  });

  it('never exposes a password or salt even when the document carries them', () => {
    const withSecrets = Object.assign(foundryUser(), { password: 'hunter2', passwordSalt: 'salt' });
    const { directory } = directoryFor([withSecrets]);

    const text = JSON.stringify(directory.listUsers());
    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('salt');
  });

  it('reads empty optional fields as null and marks the module user', () => {
    const { directory } = directoryFor([
      foundryUser({ id: 'gm', role: 4, isGM: true, pronouns: '', character: null, avatar: '', color: '#123456', targets: undefined })
    ]);

    expect(directory.findUser('gm')).toMatchObject({
      role: 'gamemaster',
      isSelf: true,
      pronouns: null,
      character: null,
      avatar: null,
      color: '#123456',
      targetTokenIds: []
    });
  });

  it('reports no scene for an offline user, whose last scene the core keeps', () => {
    const { directory } = directoryFor([foundryUser({ active: false, viewedScene: 'keep' })]);

    expect(directory.findUser('ann')?.viewedScene).toBeNull();
  });

  it('reports no scene for a scene that no longer exists', () => {
    const { directory } = directoryFor([foundryUser({ viewedScene: 'gone' })]);

    expect(directory.findUser('ann')?.viewedScene).toBeNull();
  });

  it('lists the permissions the user effectively holds, by CONST.USER_PERMISSIONS name', () => {
    const { directory } = directoryFor([foundryUser()]);

    expect(directory.listPermissions('ann')).toEqual(['MACRO_SCRIPT', 'PING_CANVAS']);
    expect(directory.listPermissions('ghost')).toBeNull();
  });

  it('checks actors in game.actors', () => {
    const { directory } = directoryFor([]);

    expect(directory.hasActor('hero')).toBe(true);
    expect(directory.hasActor('ghost')).toBe(false);
  });

  it('sends only whitelisted fields, in the shape BaseUser accepted in the probe', async () => {
    const ann = foundryUser();
    const { directory } = directoryFor([ann]);

    await directory.updateUser('ann', {
      name: 'Annie',
      color: '#00aa11',
      pronouns: null,
      characterId: null,
      role: 'trusted'
    });

    expect(ann.update).toHaveBeenCalledWith({
      name: 'Annie',
      color: '#00aa11',
      pronouns: '',
      character: null,
      role: 2
    });
  });

  it('sends nothing for omitted fields', async () => {
    const ann = foundryUser();
    const { directory } = directoryFor([ann]);

    await directory.updateUser('ann', { characterId: 'hero', name: undefined });

    expect(ann.update).toHaveBeenCalledWith({ character: 'hero' });
  });

  it('reads the user again after the update, because a role change replaces the document', async () => {
    const ann = foundryUser();
    const { directory, users } = directoryFor([ann]);
    (ann.update as jest.Mock).mockImplementation(() => {
      users.set('ann', foundryUser({ role: 2 }));
      return Promise.resolve(ann);
    });

    const updated = await directory.updateUser('ann', { role: 'trusted' });

    expect(updated?.role).toBe('trusted');
  });

  it('resolves to null for an unknown user', async () => {
    const { directory } = directoryFor([]);

    await expect(directory.updateUser('ghost', { name: 'X' })).resolves.toBeNull();
  });
});
