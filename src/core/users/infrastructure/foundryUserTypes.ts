/**
 * The parts of the client `User` document the context reads (`BaseUser` schema
 * plus the client-only `active`, `viewedScene` and `targets`, Foundry 13–14).
 * `password` and `passwordSalt` are left out on purpose: nothing here may read them.
 */
export interface FoundryUser {
  id: string;
  name: string;
  /** `CONST.USER_ROLES` code; read-only on the instance, rebuilt by the core after a role change. */
  role: number;
  isGM: boolean;
  active: boolean;
  /** A `Color` (a Number subclass with `css`) on the client; its source is a `#rrggbb` string. */
  color: FoundryColor | string | null | undefined;
  /** Prepared by the client: the own avatar, else the character's image, else the default token. */
  avatar: string | null | undefined;
  pronouns?: string | null | undefined;
  /** A getter over `game.actors`; null for an unset or a deleted actor. */
  character: FoundryUserCharacter | null | undefined;
  viewedScene: string | null | undefined;
  targets?: FoundryUserTargets | undefined;
  hasPermission(permission: string): boolean;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryColor {
  css: string;
}

export interface FoundryUserCharacter {
  id: string;
  name: string;
}

/** `UserTargets`: a Set of Token placeables with an `ids` getter. */
export interface FoundryUserTargets extends Iterable<{ id: string }> {
  ids?: string[] | undefined;
}

export interface FoundryUsersCollection {
  contents: FoundryUser[];
  get(id: string): FoundryUser | undefined;
}

export interface FoundryUserGame {
  users: FoundryUsersCollection;
  userId: string | null | undefined;
  actors: { get(id: string): unknown };
  scenes: { get(id: string): { id: string; name: string } | undefined };
}

export interface FoundryUserGlobals {
  game: FoundryUserGame;
  CONST: { USER_PERMISSIONS: Record<string, unknown> };
}

export type UserGlobalsProvider = () => FoundryUserGlobals;
