import type { UserRole } from '@/core/users/domain';

// `CONST.USER_ROLES`, identical in Foundry 11–14 (verified against 13.351 and 14.368).
const ROLE_CODES: Readonly<Record<UserRole, number>> = {
  none: 0,
  player: 1,
  trusted: 2,
  assistant: 3,
  gamemaster: 4
};

export function roleToCode(role: UserRole): number {
  return ROLE_CODES[role];
}

/** An unknown code is read by the GM flag, so it can never pass for a role below assistant. */
export function roleFromCode(code: number, isGM: boolean): UserRole {
  const role = (Object.keys(ROLE_CODES) as UserRole[]).find((name) => ROLE_CODES[name] === code);
  if (role !== undefined) {
    return role;
  }
  return isGM ? 'gamemaster' : 'none';
}
