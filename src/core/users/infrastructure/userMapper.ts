import type { User, UserChanges, UserScene } from '@/core/users/domain';
import type { FoundryUser, FoundryUserGame } from './foundryUserTypes';
import { roleFromCode, roleToCode } from './userRoleCodes';

function readColor(color: FoundryUser['color']): string | null {
  if (typeof color === 'string') {
    return color;
  }
  return color?.css ?? null;
}

function nonEmpty(value: string | null | undefined): string | null {
  return value === undefined || value === null || value === '' ? null : value;
}

// The core keeps the last scene of a user who left, so it is reported only while they are connected.
function readViewedScene(user: FoundryUser, game: FoundryUserGame): UserScene | null {
  if (!user.active || typeof user.viewedScene !== 'string') {
    return null;
  }
  const scene = game.scenes.get(user.viewedScene);
  return scene !== undefined ? { id: scene.id, name: scene.name } : null;
}

function readTargetIds(user: FoundryUser): string[] {
  if (user.targets === undefined) {
    return [];
  }
  return user.targets.ids ?? Array.from(user.targets, (token) => token.id);
}

export function toUser(user: FoundryUser, game: FoundryUserGame): User {
  const character = user.character ?? null;
  return {
    id: user.id,
    name: user.name,
    role: roleFromCode(user.role, user.isGM),
    isGM: user.isGM,
    isSelf: game.userId === user.id,
    active: user.active,
    color: readColor(user.color),
    avatar: nonEmpty(user.avatar),
    pronouns: nonEmpty(user.pronouns),
    character: character !== null ? { id: character.id, name: character.name } : null,
    viewedScene: readViewedScene(user, game),
    targetTokenIds: readTargetIds(user)
  };
}

/** Only these fields ever reach `User#update`: never a password, a salt or the permission table. */
export function toFoundryUserUpdate(changes: UserChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if (changes.color !== undefined) {
    data['color'] = changes.color;
  }
  if (changes.pronouns !== undefined) {
    data['pronouns'] = changes.pronouns ?? '';
  }
  if (changes.characterId !== undefined) {
    data['character'] = changes.characterId;
  }
  if (changes.role !== undefined) {
    data['role'] = roleToCode(changes.role);
  }
  return data;
}
