export { USER_ROLES, hasUserChanges } from './model/User';
export type { User, UserChanges, UserCharacter, UserProfile, UserRole, UserScene } from './model/User';
export {
  OwnRoleChangeRefusedError,
  PrivilegedUserRoleChangeRefusedError,
  UserNotFoundError,
  UserRoleNotAssignableError
} from './errors/userErrors';
export { isPrivilegedRole, requireAssignableRole } from './rules/roleAssignment';
export type { UserDirectory } from './ports/UserDirectory';
