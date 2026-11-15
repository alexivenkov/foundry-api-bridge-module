import type { UserDetails, UserSummary } from '@/commands/types';
import type { User, UserProfile } from '@/core/users';

export function toWireUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    isGM: user.isGM,
    isSelf: user.isSelf,
    active: user.active,
    color: user.color,
    avatar: user.avatar,
    pronouns: user.pronouns,
    character: user.character !== null ? { ...user.character } : null,
    viewedScene: user.viewedScene !== null ? { ...user.viewedScene } : null,
    targetTokenIds: [...user.targetTokenIds]
  };
}

export function toWireUserDetails(profile: UserProfile): UserDetails {
  return { ...toWireUserSummary(profile.user), permissions: [...profile.permissions] };
}
