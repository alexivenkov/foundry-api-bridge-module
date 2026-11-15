import type { User, UserChanges, UserDirectory } from '../../domain';

export function user(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Ann',
    role: 'player',
    isGM: false,
    isSelf: false,
    active: true,
    color: '#ff0000',
    avatar: 'icons/svg/mystery-man.svg',
    pronouns: null,
    character: null,
    viewedScene: null,
    targetTokenIds: [],
    ...overrides
  };
}

export class FakeUserDirectory implements UserDirectory {
  readonly updates: Array<{ userId: string; changes: UserChanges }> = [];
  losesUserOnUpdate = false;
  private readonly users: User[];

  constructor(
    users: readonly User[],
    private readonly actorIds: readonly string[] = [],
    private readonly permissions: Readonly<Record<string, readonly string[]>> = {}
  ) {
    this.users = [...users];
  }

  listUsers(): readonly User[] {
    return this.users;
  }

  findUser(userId: string): User | null {
    return this.users.find((candidate) => candidate.id === userId) ?? null;
  }

  listPermissions(userId: string): readonly string[] | null {
    return this.findUser(userId) !== null ? (this.permissions[userId] ?? []) : null;
  }

  hasActor(actorId: string): boolean {
    return this.actorIds.includes(actorId);
  }

  updateUser(userId: string, changes: UserChanges): Promise<User | null> {
    this.updates.push({ userId, changes });
    const index = this.users.findIndex((candidate) => candidate.id === userId);
    const current = this.users[index];
    if (this.losesUserOnUpdate || current === undefined) {
      return Promise.resolve(null);
    }
    const updated: User = {
      ...current,
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.role !== undefined ? { role: changes.role } : {}),
      ...(changes.pronouns !== undefined ? { pronouns: changes.pronouns } : {}),
      ...(changes.characterId !== undefined
        ? { character: changes.characterId === null ? null : { id: changes.characterId, name: 'Hero' } }
        : {})
    };
    this.users[index] = updated;
    return Promise.resolve(updated);
  }
}
