import type { ImportPlaylistSoundsParams, ImportPlaylistSoundsResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryPlaylistManagementService,
  importPlaylistSoundsRequestSchema,
  toImportPlaylistSoundsCommand
} from '@/core/playlists';
import { toWirePlaylistSoundSnapshot, type PlaylistManagementHandlerDependencies } from './playlistWireMappers';

export function createImportPlaylistSoundsHandler(
  deps: PlaylistManagementHandlerDependencies = {}
): (params: ImportPlaylistSoundsParams) => Promise<ImportPlaylistSoundsResult> {
  const service = createFoundryPlaylistManagementService(deps.gameProvider);

  return async function importPlaylistSoundsHandler(
    params: ImportPlaylistSoundsParams
  ): Promise<ImportPlaylistSoundsResult> {
    const command = toImportPlaylistSoundsCommand(parseRequest(importPlaylistSoundsRequestSchema, params));
    const { sounds, skipped } = await service.importSounds(command);
    return {
      playlistId: command.playlistId,
      sounds: sounds.map(toWirePlaylistSoundSnapshot),
      skipped: [...skipped]
    };
  };
}

export const importPlaylistSoundsHandler = createImportPlaylistSoundsHandler();
