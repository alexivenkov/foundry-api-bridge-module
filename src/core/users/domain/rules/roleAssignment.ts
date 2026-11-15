import {
  OwnRoleChangeRefusedError,
  PrivilegedUserRoleChangeRefusedError,
  UserRoleNotAssignableError
} from '@/core/users/domain/errors/userErrors';
import type { User, UserRole } from '@/core/users/domain/model/User';

const PRIVILEGED_ROLES: readonly UserRole[] = ['assistant', 'gamemaster'];

export function isPrivilegedRole(role: UserRole): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

/**
 * The module acts for an outside caller with the GM's rights, so it never
 * hands out GM powers, never takes them from a GM, and never touches the role
 * of the user it runs as: the core logs that user out, which would cut the
 * caller off.
 */
export function requireAssignableRole(target: User, role: UserRole): void {
  if (isPrivilegedRole(role)) {
    throw new UserRoleNotAssignableError(role);
  }
  if (target.isSelf) {
    throw new OwnRoleChangeRefusedError();
  }
  if (isPrivilegedRole(target.role)) {
    throw new PrivilegedUserRoleChangeRefusedError(target.id, target.role);
  }
}
