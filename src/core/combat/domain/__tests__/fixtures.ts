import { NO_VITALS } from '../../../shared';
import type { BattlefieldToken, Combat, Combatant } from '..';

export function combatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'c1',
    actorId: 'a1',
    tokenId: 't1',
    name: 'Fighter',
    img: 'icons/fighter.webp',
    initiative: 15,
    defeated: false,
    hidden: false,
    ...overrides
  };
}

export function combat(overrides: Partial<Combat> = {}): Combat {
  return {
    id: 'fight',
    round: 1,
    turn: 0,
    started: true,
    turnOrder: [combatant()],
    current: combatant(),
    ...overrides
  };
}

export function battlefieldToken(overrides: Partial<BattlefieldToken> = {}): BattlefieldToken {
  return {
    id: 't1',
    name: 'Fighter',
    x: 500,
    y: 500,
    width: 1,
    height: 1,
    disposition: 'friendly',
    actorId: 'a1',
    statuses: [],
    vitals: NO_VITALS,
    ...overrides
  };
}
