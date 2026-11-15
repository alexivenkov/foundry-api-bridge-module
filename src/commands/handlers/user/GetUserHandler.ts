import type { GetUserParams, GetUserResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryUserService, getUserRequestSchema, toGetUserQuery, type UserWiring } from '@/core/users';
import { toWireUserDetails } from './userWireMappers';

export function createGetUserHandler(wiring: UserWiring = {}): (params: GetUserParams) => Promise<GetUserResult> {
  const service = createFoundryUserService(wiring);

  return function getUserHandler(params: GetUserParams): Promise<GetUserResult> {
    try {
      const profile = service.getUser(toGetUserQuery(parseRequest(getUserRequestSchema, params)));
      return Promise.resolve(toWireUserDetails(profile));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getUserHandler = createGetUserHandler();
