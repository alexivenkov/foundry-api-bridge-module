import type { User, UserChanges } from '@/core/users/domain/model/User';

// Reads are synchronous: the user collection lives in memory.
export interface UserDirectory {
  listUsers(): readonly User[];
  findUser(userId: string): User | null;
  /** Names of the core permissions the user effectively holds; null when the user is gone. */
  listPermissions(userId: string): readonly string[] | null;
  hasActor(actorId: string): boolean;
  /** Resolves to null when the user is gone. */
  updateUser(userId: string, changes: UserChanges): Promise<User | null>;
}
