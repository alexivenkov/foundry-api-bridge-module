import type { Pf2eCompendiumItemSnapshot } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumDocument } from './foundryCompendiumPackTypes';
import {
  finiteNumberAt,
  stringArrayAt,
  stringAt,
  valueAt
} from './systemFieldReaders';

// Coin weights of the pf2e price object (system.price.value = partial
// {pp, gp, sp, cp}) normalized to gold pieces.
const COIN_TO_GOLD: ReadonlyArray<readonly [string, number]> = [
  ['pp', 10],
  ['gp', 1],
  ['sp', 0.1],
  ['cp', 0.01]
];

// pf2e 7.x paths (verified against installed 7.12.2):
//   level      → system.level.value (spell rank for spells)
//   traits     → system.traits.value, rarity → system.traits.rarity
//   category   → system.category (legacy packs: system.featType.value)
//   traditions → system.traits.traditions (spells)
//   price      → system.price.value = partial coins object
export class Pf2eCompendiumItemMapper {
  toSnapshot(doc: Pf2eCompendiumDocument, packId: string): Pf2eCompendiumItemSnapshot {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      level: finiteNumberAt(doc.system, ['level', 'value']),
      traits: stringArrayAt(doc.system, ['traits', 'value']),
      rarity: stringAt(doc.system, ['traits', 'rarity']),
      category:
        stringAt(doc.system, ['category']) ?? stringAt(doc.system, ['featType', 'value']),
      traditions: stringArrayAt(doc.system, ['traits', 'traditions']),
      priceGold: this.extractPriceGold(doc),
      packId,
      uuid: doc.uuid
    };
  }

  private extractPriceGold(doc: Pf2eCompendiumDocument): number | null {
    const coins = valueAt(doc.system, ['price', 'value']);
    if (coins === null || coins === undefined || typeof coins !== 'object') {
      return null;
    }

    let gold = 0;
    for (const [coin, weight] of COIN_TO_GOLD) {
      const amount = (coins as Record<string, unknown>)[coin];
      if (typeof amount === 'number' && Number.isFinite(amount)) {
        gold += amount * weight;
      }
    }
    return gold;
  }
}
