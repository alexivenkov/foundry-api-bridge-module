import type { UpdateUserParams, UpdateUserResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryUserService, toUpdateUserCommand, updateUserRequestSchema, type UserWiring } from '@/core/users';
import { toWireUserDetails } from './userWireMappers';

export function createUpdateUserHandler(
  wiring: UserWiring = {}
): (params: UpdateUserParams) => Promise<UpdateUserResult> {
  const service = createFoundryUserService(wiring);

  return async function updateUserHandler(params: UpdateUserParams): Promise<UpdateUserResult> {
    const command = toUpdateUserCommand(parseRequest(updateUserRequestSchema, params));
    return toWireUserDetails(await service.updateUser(command));
  };
}

export const updateUserHandler = createUpdateUserHandler();
