import { foundryGeneration } from '@/compat/foundryVersion';
import { findFoundryScene } from '@/core/shared';
import type { NoteEnvironment, NoteFeatures } from '@/core/notes/domain';
import type { NoteGameProvider } from './FoundryNoteStore';

/**
 * `BaseNote#locked` and `#levels` exist in Foundry 14.368, not in 13.351.
 * Generation 0 means "not known yet" and reads as the newest.
 */
export function noteFeaturesFor(generation: number): NoteFeatures {
  return { levels: generation === 0 || generation >= 14 };
}

export class FoundryNoteEnvironment implements NoteEnvironment {
  constructor(
    private readonly gameProvider: NoteGameProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): NoteFeatures {
    return noteFeaturesFor(this.generation());
  }

  listSceneLevelIds(sceneId: string): readonly string[] {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    return scene?.levels?.contents.map((level) => level.id) ?? [];
  }
}
