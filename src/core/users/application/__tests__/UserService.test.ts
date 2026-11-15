import { ActorNotFoundError } from '../../../shared';
import {
  OwnRoleChangeRefusedError,
  PrivilegedUserRoleChangeRefusedError,
  UserNotFoundError,
  UserRoleNotAssignableError
} from '../../domain';
import { UserService } from '../UserService';
import { FakeUserDirectory, user } from './fakePorts';

function setup(): { service: UserService; directory: FakeUserDirectory } {
  const directory = new FakeUserDirectory(
    [
      user({ id: 'gm', name: 'GM', role: 'gamemaster', isGM: true, isSelf: true }),
      user({ id: 'ann', name: 'Ann' }),
      user({ id: 'bob', name: 'Bob', role: 'assistant', isGM: true, active: false })
    ],
    ['hero'],
    { ann: ['MACRO_SCRIPT', 'PING_CANVAS'] }
  );
  return { service: new UserService({ users: directory }), directory };
}

describe('UserService', () => {
  describe('listUsers', () => {
    it('lists every user', () => {
      expect(setup().service.listUsers({ activeOnly: false }).map((u) => u.id)).toEqual(['gm', 'ann', 'bob']);
    });

    it('lists only the connected users on request', () => {
      expect(setup().service.listUsers({ activeOnly: true }).map((u) => u.id)).toEqual(['gm', 'ann']);
    });
  });

  describe('getUser', () => {
    it('returns the user with their permissions', () => {
      const profile = setup().service.getUser({ userId: 'ann' });

      expect(profile.user.name).toBe('Ann');
      expect(profile.permissions).toEqual(['MACRO_SCRIPT', 'PING_CANVAS']);
    });

    it('rejects an unknown user', () => {
      expect(() => setup().service.getUser({ userId: 'nobody' })).toThrow('User not found: nobody');
    });
  });

  describe('updateUser', () => {
    it('applies the profile changes and returns the updated profile', async () => {
      const { service, directory } = setup();
      const changes = { name: 'Annie', pronouns: null, characterId: 'hero', role: 'trusted' as const };

      const profile = await service.updateUser({ userId: 'ann', changes });

      expect(directory.updates).toEqual([{ userId: 'ann', changes }]);
      expect(profile.user).toMatchObject({ name: 'Annie', role: 'trusted', character: { id: 'hero', name: 'Hero' } });
      expect(profile.permissions).toEqual(['MACRO_SCRIPT', 'PING_CANVAS']);
    });

    it('unassigns the character with null without checking any actor', async () => {
      const { service, directory } = setup();

      await service.updateUser({ userId: 'ann', changes: { characterId: null } });

      expect(directory.updates).toEqual([{ userId: 'ann', changes: { characterId: null } }]);
    });

    it('does not write when nothing is to change', async () => {
      const { service, directory } = setup();

      const profile = await service.updateUser({ userId: 'ann', changes: {} });

      expect(directory.updates).toEqual([]);
      expect(profile.user.id).toBe('ann');
    });

    it('rejects an unknown user', async () => {
      await expect(setup().service.updateUser({ userId: 'nobody', changes: { name: 'X' } })).rejects.toThrow(
        UserNotFoundError
      );
    });

    it('rejects an unknown actor as character', async () => {
      const { service, directory } = setup();

      await expect(service.updateUser({ userId: 'ann', changes: { characterId: 'ghost' } })).rejects.toThrow(
        new ActorNotFoundError('ghost').message
      );
      expect(directory.updates).toEqual([]);
    });

    it.each([
      ['assigning a GM role', 'ann', 'gamemaster', UserRoleNotAssignableError],
      ['changing the own role', 'gm', 'player', OwnRoleChangeRefusedError],
      ['changing an assistant', 'bob', 'player', PrivilegedUserRoleChangeRefusedError]
    ] as const)('refuses %s and writes nothing', async (_label, userId, role, error) => {
      const { service, directory } = setup();

      await expect(service.updateUser({ userId, changes: { name: 'X', role } })).rejects.toThrow(error);
      expect(directory.updates).toEqual([]);
    });

    it('still lets a GM user be renamed', async () => {
      const profile = await setup().service.updateUser({ userId: 'bob', changes: { name: 'Robert' } });

      expect(profile.user.name).toBe('Robert');
    });

    it('fails with not found when the user vanished during the update', async () => {
      const { service, directory } = setup();
      directory.losesUserOnUpdate = true;

      await expect(service.updateUser({ userId: 'ann', changes: { name: 'X' } })).rejects.toThrow('User not found: ann');
    });
  });
});
