import type { UserChanges } from '@/core/users/domain';

export interface ListUsersQuery {
  readonly activeOnly: boolean;
}

export interface GetUserQuery {
  readonly userId: string;
}

export interface UpdateUserCommand {
  readonly userId: string;
  readonly changes: UserChanges;
}
