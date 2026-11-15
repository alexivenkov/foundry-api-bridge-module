import type { GetUsersParams, GetUsersResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryUserService, getUsersRequestSchema, toListUsersQuery, type UserWiring } from '@/core/users';
import { toWireUserSummary } from './userWireMappers';

export function createGetUsersHandler(wiring: UserWiring = {}): (params: GetUsersParams) => Promise<GetUsersResult> {
  const service = createFoundryUserService(wiring);

  return function getUsersHandler(params: GetUsersParams): Promise<GetUsersResult> {
    try {
      const users = service.listUsers(toListUsersQuery(parseRequest(getUsersRequestSchema, params)));
      return Promise.resolve({ users: users.map(toWireUserSummary) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getUsersHandler = createGetUsersHandler();
