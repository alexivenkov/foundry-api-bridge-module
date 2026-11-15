import type { FoundryUserGlobals } from '../../../../core/users';
import { createGetUserHandler } from '../GetUserHandler';
import { createGetUsersHandler } from '../GetUsersHandler';
import { createUpdateUserHandler } from '../UpdateUserHandler';

interface FakeUser {
  id: string;
  name: string;
  role: number;
  isGM: boolean;
  active: boolean;
  color: { css: string };
  avatar: string;
  pronouns: string;
  character: { id: string; name: string } | null;
  viewedScene: string | null;
  targets: Set<{ id: string }>;
  hasPermission: (permission: string) => boolean;
  update: jest.Mock;
}

function fakeUser(overrides: Partial<FakeUser>): FakeUser {
  return {
    id: 'ann',
    name: 'Ann',
    role: 1,
    isGM: false,
    active: true,
    color: { css: '#ff0000' },
    avatar: 'icons/svg/mystery-man.svg',
    pronouns: '',
    character: null,
    viewedScene: null,
    targets: new Set(),
    hasPermission: (permission) => permission === 'PING_CANVAS',
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function setup(): { wiring: { globals: () => FoundryUserGlobals }; ann: FakeUser } {
  const ann = fakeUser({ targets: new Set([{ id: 't1' }]), viewedScene: 'keep' });
  const gm = fakeUser({ id: 'gm', name: 'GM', role: 4, isGM: true });
  const offline = fakeUser({ id: 'bob', name: 'Bob', active: false });
  const users = new Map([gm, ann, offline].map((u) => [u.id, u]));
  const globals = {
    game: {
      users: { get: (id: string) => users.get(id), get contents() { return [...users.values()]; } },
      userId: 'gm',
      actors: { get: (id: string) => (id === 'hero' ? { id } : undefined) },
      scenes: { get: (id: string) => (id === 'keep' ? { id: 'keep', name: 'Keep' } : undefined) }
    },
    CONST: { USER_PERMISSIONS: { ACTOR_CREATE: {}, PING_CANVAS: {} } }
  } as unknown as FoundryUserGlobals;
  return { wiring: { globals: () => globals }, ann };
}

describe('user handlers', () => {
  describe('get-users', () => {
    it('lists the users as wire summaries', async () => {
      const result = await createGetUsersHandler(setup().wiring)({});

      expect(result.users.map((u) => u.id)).toEqual(['gm', 'ann', 'bob']);
      expect(result.users[1]).toEqual({
        id: 'ann',
        name: 'Ann',
        role: 'player',
        isGM: false,
        isSelf: false,
        active: true,
        color: '#ff0000',
        avatar: 'icons/svg/mystery-man.svg',
        pronouns: null,
        character: null,
        viewedScene: { id: 'keep', name: 'Keep' },
        targetTokenIds: ['t1']
      });
      expect(result.users[0]).not.toHaveProperty('permissions');
    });

    it('filters the connected users', async () => {
      const result = await createGetUsersHandler(setup().wiring)({ activeOnly: true });

      expect(result.users.map((u) => u.id)).toEqual(['gm', 'ann']);
    });

    it('rejects an invalid filter', async () => {
      await expect(
        createGetUsersHandler(setup().wiring)({ activeOnly: 'no' } as unknown as { activeOnly: boolean })
      ).rejects.toThrow('activeOnly');
    });
  });

  describe('get-user', () => {
    it('returns the user with their permissions', async () => {
      const result = await createGetUserHandler(setup().wiring)({ userId: 'gm' });

      expect(result).toMatchObject({ id: 'gm', role: 'gamemaster', isGM: true, isSelf: true, permissions: ['PING_CANVAS'] });
    });

    it('rejects an unknown user', async () => {
      await expect(createGetUserHandler(setup().wiring)({ userId: 'ghost' })).rejects.toThrow('User not found: ghost');
    });

    it('rejects a missing userId', async () => {
      await expect(createGetUserHandler(setup().wiring)({} as { userId: string })).rejects.toThrow('userId');
    });
  });

  describe('update-user', () => {
    it('updates the profile and returns the details', async () => {
      const { wiring, ann } = setup();

      const result = await createUpdateUserHandler(wiring)({ userId: 'ann', characterId: 'hero', role: 'trusted' });

      expect(ann.update).toHaveBeenCalledWith({ character: 'hero', role: 2 });
      expect(result).toMatchObject({ id: 'ann', permissions: ['PING_CANVAS'] });
    });

    it('refuses to hand out the gamemaster role', async () => {
      const { wiring, ann } = setup();

      await expect(createUpdateUserHandler(wiring)({ userId: 'ann', role: 'gamemaster' })).rejects.toThrow(
        "Role 'gamemaster' cannot be assigned through the API; only none, player and trusted can"
      );
      expect(ann.update).not.toHaveBeenCalled();
    });

    it('rejects an unknown user and an unknown actor', async () => {
      const handler = createUpdateUserHandler(setup().wiring);

      await expect(handler({ userId: 'ghost', name: 'X' })).rejects.toThrow('User not found: ghost');
      await expect(handler({ userId: 'ann', characterId: 'ghost' })).rejects.toThrow('Actor not found: ghost');
    });

    it('rejects an invalid color', async () => {
      await expect(createUpdateUserHandler(setup().wiring)({ userId: 'ann', color: 'red' })).rejects.toThrow('color');
    });
  });
});
