import type { User, UserChanges, UserDirectory } from '@/core/users/domain';
import type { FoundryUser, FoundryUserGlobals, UserGlobalsProvider } from './foundryUserTypes';
import { toFoundryUserUpdate, toUser } from './userMapper';

const fromGlobalThis: UserGlobalsProvider = () => globalThis as unknown as FoundryUserGlobals;

/** Anti-corruption layer over `game.users`. */
export class FoundryUserDirectory implements UserDirectory {
  constructor(private readonly globals: UserGlobalsProvider = fromGlobalThis) {}

  listUsers(): readonly User[] {
    const { game } = this.globals();
    return game.users.contents.map((user) => toUser(user, game));
  }

  findUser(userId: string): User | null {
    const { game } = this.globals();
    const user = game.users.get(userId);
    return user !== undefined ? toUser(user, game) : null;
  }

  listPermissions(userId: string): readonly string[] | null {
    const { game, CONST } = this.globals();
    const user = game.users.get(userId);
    if (user === undefined) {
      return null;
    }
    return Object.keys(CONST.USER_PERMISSIONS).filter((permission) => user.hasPermission(permission));
  }

  hasActor(actorId: string): boolean {
    return this.globals().game.actors.get(actorId) !== undefined;
  }

  async updateUser(userId: string, changes: UserChanges): Promise<User | null> {
    const before = this.findFoundryUser(userId);
    if (before === undefined) {
      return null;
    }
    await before.update(toFoundryUserUpdate(changes));
    // A role change makes the client replace the immutable User object in the collection.
    const after = this.findFoundryUser(userId);
    return after !== undefined ? toUser(after, this.globals().game) : null;
  }

  private findFoundryUser(userId: string): FoundryUser | undefined {
    return this.globals().game.users.get(userId);
  }
}
