import type { ShowImageParams, ShowImageResult } from '@/commands/types';
import { createFoundryJournalSharingService, showImageRequestSchema, toShowImageCommand } from '@/core/journals';
import { parseRequest } from '@/core/shared';
import type { JournalHandlerDependencies } from './journalWireMappers';

export function createShowImageHandler(
  deps: JournalHandlerDependencies = {}
): (params: ShowImageParams) => Promise<ShowImageResult> {
  const service = createFoundryJournalSharingService(deps.globals);

  return async function showImageHandler(params: ShowImageParams): Promise<ShowImageResult> {
    const image = await service.showImage(toShowImageCommand(parseRequest(showImageRequestSchema, params)));
    return {
      shown: true,
      src: image.src,
      title: image.title ?? null,
      caption: image.caption ?? null,
      users: [...image.users]
    };
  };
}

export const showImageHandler = createShowImageHandler();
