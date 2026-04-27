import type { AbilityKey } from '../value-objects/AbilityScore';
import type { ActorType } from '../value-objects/ActorType';
import type { CreatureType } from '../value-objects/CreatureType';
import type { Disposition } from '../value-objects/Disposition';
import type { Size } from '../value-objects/Size';

export interface ActorHitPoints {
  readonly current: number;
  readonly max: number;
}

export interface ActorSnapshot {
  readonly id: string;
  readonly name: string;
  readonly type: ActorType;
  readonly hasPlayerOwner: boolean;
  readonly folderId: string | null;
  readonly creatureType: CreatureType | null;
  readonly size: Size | null;
  readonly disposition: Disposition | null;
  readonly cr: number | null;
  readonly level: number | null;
  readonly hp: ActorHitPoints | null;
  readonly ac: number | null;
  readonly abilities: Record<AbilityKey, number> | null;
}
