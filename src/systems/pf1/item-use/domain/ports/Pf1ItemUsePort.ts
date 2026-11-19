import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { Pf1UseItemOutcome } from '../UseItemOutcome';

/**
 * Combat toggles of the system's attack dialog (`UseOptions` of pf1 11.x).
 * Left out on purpose: `held` (documented, never read by `ActionUse`) and
 * `haste` / `rapidShot` / `manyshot`, whose extra attacks only the attack
 * dialog adds (`AttackDialog#_toggleExtraAttack`); without it Rapid Shot would
 * apply its -2 with no extra attack. Verified live on pf1 11.11.
 */
export interface Pf1UseToggles {
  readonly powerAttack?: boolean;
  readonly primaryAttack?: boolean;
  readonly pointBlankShot?: boolean;
  readonly flanking?: boolean;
  readonly highGround?: boolean;
  readonly charge?: boolean;
  readonly clCheck?: boolean;
  /** Ammo item id; the system makes it the item's default ammo first. */
  readonly ammo?: string;
}

export interface UseItemOptions {
  readonly actionId: string | undefined;
  readonly cost: number | undefined;
  readonly rollMode: string | undefined;
  readonly showInChat: boolean;
  readonly toggles: Pf1UseToggles;
}

/**
 * Outbound port for `ItemPF#use`: attacks, spells, consumables and any other
 * item with actions, rolled through the system's `ActionUse` without dialogs.
 * Charges, spell slots and ammunition are consumed as the system does.
 */
export interface Pf1ItemUsePort {
  useItem(target: Pf1ActorTarget, item: string, options: UseItemOptions): Promise<Pf1UseItemOutcome>;
}
