import type { GameProvider } from '@/core/shared';
import type {
  CompendiumSummary,
  WorldDocumentCounts,
  WorldIdentity,
  WorldInspector
} from '@/core/world/domain';
import { MODULE_ID } from '@/config/moduleId';
import type { FoundryWorldInfoGame, FoundryWorldPack } from './foundryWorldTypes';

export type WorldInfoGameProvider = GameProvider<FoundryWorldInfoGame>;

/** `game.modules` knows the module by this id. */
export { MODULE_ID };

function toCompendiumSummary(pack: FoundryWorldPack): CompendiumSummary {
  return {
    id: pack.collection,
    label: pack.metadata.label,
    documentType: pack.metadata.type,
    systemId: pack.metadata.system ?? null,
    entryCount: pack.index.size
  };
}

/**
 * Reads the world, its game system and its collections off `game`. The game
 * system is only reported, never branched on.
 */
export class FoundryWorldInspector implements WorldInspector {
  constructor(private readonly gameProvider: WorldInfoGameProvider) {}

  readIdentity(): WorldIdentity {
    const game = this.gameProvider.getGame();
    return {
      id: game.world?.id ?? '',
      title: game.world?.title ?? '',
      systemId: game.system?.id ?? '',
      systemVersion: game.system?.version ?? '',
      coreVersion: game.version ?? '',
      moduleVersion: game.modules?.get(MODULE_ID)?.version ?? ''
    };
  }

  countDocuments(): WorldDocumentCounts {
    const game = this.gameProvider.getGame();
    return {
      journals: game.journal?.size ?? 0,
      actors: game.actors?.size ?? 0,
      items: game.items?.size ?? 0,
      scenes: game.scenes?.size ?? 0
    };
  }

  listCompendiums(): readonly CompendiumSummary[] {
    const compendiums: CompendiumSummary[] = [];
    this.gameProvider.getGame().packs?.forEach((pack) => {
      compendiums.push(toCompendiumSummary(pack));
    });
    return compendiums;
  }
}
