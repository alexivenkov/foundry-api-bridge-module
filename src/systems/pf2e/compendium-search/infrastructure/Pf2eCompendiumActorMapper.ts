import type { Pf2eActorHitPoints, Pf2eCompendiumActorSnapshot } from '@/systems/pf2e/compendium-search/domain';
import type { Pf2eCompendiumDocument } from './foundryCompendiumPackTypes';
import { finiteNumberAt, stringArrayAt, stringAt } from './systemFieldReaders';

// pf2e 7.x paths (verified against installed 7.12.2 and shipped pack data):
//   level  → system.details.level.value
//   traits → system.traits.value (string[]), rarity → system.traits.rarity
//   size   → system.traits.size.value
//   hp     → system.attributes.hp.{value,max}, ac → system.attributes.ac.value
export class Pf2eCompendiumActorMapper {
  toSnapshot(
    doc: Pf2eCompendiumDocument,
    packId: string
  ): Pf2eCompendiumActorSnapshot {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      level: finiteNumberAt(doc.system, ['details', 'level', 'value']),
      traits: stringArrayAt(doc.system, ['traits', 'value']),
      rarity: stringAt(doc.system, ['traits', 'rarity']),
      size: stringAt(doc.system, ['traits', 'size', 'value']),
      hp: this.extractHp(doc),
      ac: finiteNumberAt(doc.system, ['attributes', 'ac', 'value']),
      packId,
      uuid: doc.uuid
    };
  }

  private extractHp(doc: Pf2eCompendiumDocument): Pf2eActorHitPoints | null {
    const current = finiteNumberAt(doc.system, ['attributes', 'hp', 'value']);
    const max = finiteNumberAt(doc.system, ['attributes', 'hp', 'max']);
    if (current === null || max === null) {
      return null;
    }
    return { current, max };
  }
}
