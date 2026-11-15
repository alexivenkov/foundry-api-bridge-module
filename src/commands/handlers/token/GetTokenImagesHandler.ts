import type { GetTokenImagesParams, GetTokenImagesResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { createFoundryTokenAppearanceService, getPrototypeTokenRequestSchema, toPrototypeTokenQuery } from '@/core/tokens';
import type { TokenAppearanceHandlerDependencies } from './tokenWireMappers';

export function createGetTokenImagesHandler(
  deps: TokenAppearanceHandlerDependencies = {}
): (params: GetTokenImagesParams) => Promise<GetTokenImagesResult> {
  const service = createFoundryTokenAppearanceService(deps);

  return async function getTokenImagesHandler(params: GetTokenImagesParams): Promise<GetTokenImagesResult> {
    const query = toPrototypeTokenQuery(parseRequest(getPrototypeTokenRequestSchema, params));
    const result = await service.getTokenImages(query);
    return { actorId: result.actorId, randomImg: result.randomImg, images: [...result.images] };
  };
}

export const getTokenImagesHandler = createGetTokenImagesHandler();
