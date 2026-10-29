import { ValidationError } from '@/systems/shared/domain/errors';
import { settingFlag, type FoundrySwadeActor, type FoundrySwadeGame } from '@/systems/swade/shared/infrastructure';
import { computeDamage, type SwadeDamagePreview } from '@/systems/swade/damage/domain';

export interface DamageTargetSnapshot {
  readonly toughness: number;
  readonly armor: number;
  readonly isVehicle: boolean;
  readonly alreadyShaken: boolean;
  readonly hardy: boolean;
  readonly woundsBefore: number;
  readonly woundsMax: number;
}

/**
 * What the Toughness rule needs from an actor: creatures keep Toughness in
 * `system.stats.toughness.{value,armor}` (armor included in `value`),
 * vehicles in `system.toughness.{total,armor}`.
 */
export function snapshotDamageTarget(actor: FoundrySwadeActor): DamageTargetSnapshot {
  const isVehicle = actor.type === 'vehicle';
  const toughness = isVehicle ? actor.system.toughness : actor.system.stats?.toughness;
  if (!toughness) {
    throw new ValidationError(`Actor has no Toughness: ${actor.name}`);
  }
  const value = isVehicle ? actor.system.toughness?.total : actor.system.stats?.toughness?.value;
  return {
    toughness: value ?? 0,
    armor: toughness.armor,
    isVehicle,
    alreadyShaken: actor.statuses.has('shaken'),
    hardy: actor.getFlag('swade', 'hardy') === true,
    woundsBefore: actor.system.wounds?.value ?? 0,
    woundsMax: actor.system.wounds?.max ?? 0
  };
}

/** The rule's verdict for `damage` with `ap` against the actor, without touching it. */
export function previewDamage(game: FoundrySwadeGame, actor: FoundrySwadeActor, damage: number, ap: number): SwadeDamagePreview {
  const snapshot = snapshotDamageTarget(actor);
  return computeDamage({ ...snapshot, damage, ap, woundCap: settingFlag(game, 'woundCap') });
}
