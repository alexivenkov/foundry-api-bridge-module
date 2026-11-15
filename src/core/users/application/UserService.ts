import { ActorNotFoundError } from '@/core/shared';
import {
  UserNotFoundError,
  hasUserChanges,
  requireAssignableRole,
  type User,
  type UserDirectory,
  type UserProfile
} from '@/core/users/domain';
import type { GetUserQuery, ListUsersQuery, UpdateUserCommand } from './commands';

export interface UserServiceDependencies {
  readonly users: UserDirectory;
}

/**
 * Reads the world's users and changes their profile. Creating and deleting
 * users, passwords and the world permission table are deliberately out of
 * reach of this service.
 */
export class UserService {
  constructor(private readonly deps: UserServiceDependencies) {}

  listUsers(query: ListUsersQuery): readonly User[] {
    const users = this.deps.users.listUsers();
    return query.activeOnly ? users.filter((user) => user.active) : users;
  }

  getUser(query: GetUserQuery): UserProfile {
    return this.profileOf(this.requireUser(query.userId));
  }

  async updateUser(command: UpdateUserCommand): Promise<UserProfile> {
    const { users } = this.deps;
    const user = this.requireUser(command.userId);
    const { changes } = command;

    if (changes.role !== undefined) {
      requireAssignableRole(user, changes.role);
    }
    if (typeof changes.characterId === 'string' && !users.hasActor(changes.characterId)) {
      throw new ActorNotFoundError(changes.characterId);
    }
    if (!hasUserChanges(changes)) {
      return this.profileOf(user);
    }

    const updated = await users.updateUser(user.id, changes);
    if (updated === null) {
      throw new UserNotFoundError(user.id);
    }
    return this.profileOf(updated);
  }

  private requireUser(userId: string): User {
    const user = this.deps.users.findUser(userId);
    if (user === null) {
      throw new UserNotFoundError(userId);
    }
    return user;
  }

  private profileOf(user: User): UserProfile {
    const permissions = this.deps.users.listPermissions(user.id);
    if (permissions === null) {
      throw new UserNotFoundError(user.id);
    }
    return { user, permissions };
  }
}
