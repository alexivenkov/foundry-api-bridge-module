import type { ResolveUuidParams, ResolveUuidResult } from '@/commands/types';
import {
  createFoundryUuidResolutionService,
  resolveUuidRequestSchema,
  type FromUuidFn
} from '@/compendiums';
import { formatZodError } from '@/kernel';

export interface ResolveUuidHandlerDependencies {
  fromUuid?: FromUuidFn;
}

export function createResolveUuidHandler(
  deps: ResolveUuidHandlerDependencies = {}
): (params: ResolveUuidParams) => Promise<ResolveUuidResult> {
  const service = createFoundryUuidResolutionService(deps.fromUuid);

  return async function resolveUuidHandler(
    params: ResolveUuidParams
  ): Promise<ResolveUuidResult> {
    const parsed = resolveUuidRequestSchema.safeParse(params);
    if (!parsed.success) {
      throw new Error(formatZodError(parsed.error));
    }

    const record = await service.resolve(parsed.data.uuid);
    return {
      uuid: record.uuid,
      documentName: record.documentName,
      id: record.id,
      name: record.name,
      type: record.type,
      img: record.img,
      pack: record.pack,
      parentUuid: record.parentUuid,
      data: record.data
    };
  };
}

export const resolveUuidHandler = createResolveUuidHandler();
