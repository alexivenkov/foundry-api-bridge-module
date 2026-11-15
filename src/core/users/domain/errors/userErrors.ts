import { DomainError } from '@/kernel';
import type { UserRole } from '@/core/users/domain/model/User';

export class UserNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class UserRoleNotAssignableError extends DomainError {
  constructor(public readonly role: UserRole) {
    super(`Role '${role}' cannot be assigned through the API; only none, player and trusted can`);
    this.name = 'UserRoleNotAssignableError';
    Object.setPrototypeOf(this, UserRoleNotAssignableError.prototype);
  }
}

export class OwnRoleChangeRefusedError extends DomainError {
  constructor() {
    super('The role of the user this module runs as cannot be changed through the API');
    this.name = 'OwnRoleChangeRefusedError';
    Object.setPrototypeOf(this, OwnRoleChangeRefusedError.prototype);
  }
}

export class PrivilegedUserRoleChangeRefusedError extends DomainError {
  constructor(
    public readonly userId: string,
    public readonly currentRole: UserRole
  ) {
    super(
      `User ${userId} is ${currentRole === 'assistant' ? 'an assistant' : 'a gamemaster'}; ` +
        'the role of an assistant or gamemaster cannot be changed through the API'
    );
    this.name = 'PrivilegedUserRoleChangeRefusedError';
    Object.setPrototypeOf(this, PrivilegedUserRoleChangeRefusedError.prototype);
  }
}
