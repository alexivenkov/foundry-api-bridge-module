import type { GetUserQuery, ListUsersQuery, UpdateUserCommand } from '@/core/users/application';
import type { GetUserRequest, GetUsersRequest, UpdateUserRequest } from './userSchemas';

export function toListUsersQuery(request: GetUsersRequest): ListUsersQuery {
  return { activeOnly: request.activeOnly ?? false };
}

export function toGetUserQuery(request: GetUserRequest): GetUserQuery {
  return { userId: request.userId };
}

export function toUpdateUserCommand(request: UpdateUserRequest): UpdateUserCommand {
  return {
    userId: request.userId,
    changes: {
      name: request.name,
      color: request.color,
      pronouns: request.pronouns === '' ? null : request.pronouns,
      characterId: request.characterId,
      role: request.role
    }
  };
}
