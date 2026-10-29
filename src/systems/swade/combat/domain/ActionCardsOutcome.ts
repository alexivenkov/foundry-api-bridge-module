export interface SwadeActionCardCombatant {
  readonly combatantId: string;
  readonly name: string;
  readonly actorId: string | null;
  readonly tokenId: string | null;
  readonly initiative: number | null;
  readonly cardValue: number | null;
  readonly suitValue: number | null;
  readonly cardString: string | null;
  readonly hasJoker: boolean;
  readonly roundHeld: number | null;
  readonly turnLost: boolean;
  readonly isGroupLeader: boolean;
  readonly isDefeated: boolean;
}

export interface SwadeActionCardsOutcome {
  readonly combatId: string;
  readonly round: number;
  readonly turn: number;
  readonly combatants: readonly SwadeActionCardCombatant[];
}
