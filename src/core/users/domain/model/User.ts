export const USER_ROLES = ['none', 'player', 'trusted', 'assistant', 'gamemaster'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserCharacter {
  readonly id: string;
  readonly name: string;
}

export interface UserScene {
  readonly id: string;
  readonly name: string;
}

/**
 * A world user as the GM client sees them. It never carries a password, a
 * password salt or any other authentication field.
 */
export interface User {
  readonly id: string;
  readonly name: string;
  readonly role: UserRole;
  readonly isGM: boolean;
  /** The user the module runs as. */
  readonly isSelf: boolean;
  /** Connected right now. */
  readonly active: boolean;
  readonly color: string | null;
  readonly avatar: string | null;
  readonly pronouns: string | null;
  readonly character: UserCharacter | null;
  /** Null while the user is offline. */
  readonly viewedScene: UserScene | null;
  /** Known only for the scene this client is viewing; empty otherwise. */
  readonly targetTokenIds: readonly string[];
}

/** A user together with the names of the core permissions they effectively hold. */
export interface UserProfile {
  readonly user: User;
  readonly permissions: readonly string[];
}

/** Omitted attributes are left untouched; `null` clears the pronouns or unassigns the character. */
export interface UserChanges {
  readonly name?: string | undefined;
  readonly color?: string | undefined;
  readonly pronouns?: string | null | undefined;
  readonly characterId?: string | null | undefined;
  readonly role?: UserRole | undefined;
}

export function hasUserChanges(changes: UserChanges): boolean {
  return Object.values(changes).some((value) => value !== undefined);
}
