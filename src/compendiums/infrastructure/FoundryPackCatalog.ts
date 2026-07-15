import type { PackCatalog, PackDescriptor, PackSummary } from '@/compendiums/domain';
import type { CompendiumGameProvider } from './foundryGameProvider';
import type { FoundryPack } from './foundryPackTypes';

export class FoundryPackCatalog implements PackCatalog {
  constructor(private readonly gameProvider: CompendiumGameProvider) {}

  listPacks(): readonly PackSummary[] {
    const packs = this.gameProvider.getGame().packs;
    const summaries: PackSummary[] = [];
    packs?.forEach(pack => {
      summaries.push({
        ...toDescriptor(pack),
        packageName: pack.metadata.packageName ?? '',
        documentCount: pack.index.size
      });
    });
    return summaries;
  }

  findPack(packId: string): PackDescriptor | null {
    const pack = this.gameProvider.getGame().packs?.get(packId);
    return pack !== undefined ? toDescriptor(pack) : null;
  }
}

function toDescriptor(pack: FoundryPack): PackDescriptor {
  return {
    id: pack.collection,
    label: pack.metadata.label,
    type: pack.metadata.type,
    system: pack.metadata.system ?? ''
  };
}
