import type { CombatantResult, CombatResult } from '@/commands/types';

export interface CombatantUpdateData {
  initiative?: number;
  defeated?: boolean;
  hidden?: boolean;
}

export interface FoundryCombatant {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
  img: string;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
  update(data: CombatantUpdateData): Promise<FoundryCombatant>;
}

export interface FoundryCombatantsCollection {
  get(id: string): FoundryCombatant | undefined;
  map<T>(callback: (combatant: FoundryCombatant) => T): T[];
  contents: FoundryCombatant[];
}

export interface RollInitiativeOptions {
  formula?: string;
  messageOptions?: Record<string, unknown>;
}

export interface FoundryCombat {
  id: string;
  round: number;
  turn: number;
  started: boolean;
  combatant: FoundryCombatant | null;
  combatants: FoundryCombatantsCollection;
  turns: FoundryCombatant[];
  startCombat(): Promise<FoundryCombat>;
  nextTurn(): Promise<FoundryCombat>;
  previousTurn(): Promise<FoundryCombat>;
  endCombat(): Promise<FoundryCombat>;
  delete(): Promise<FoundryCombat>;
  activate(): Promise<void>;
  createEmbeddedDocuments(
    type: 'Combatant',
    data: FoundryCombatantCreateData[]
  ): Promise<FoundryCombatant[]>;
  deleteEmbeddedDocuments(type: 'Combatant', ids: string[]): Promise<unknown[]>;
  rollInitiative(ids: string[], options?: RollInitiativeOptions): Promise<FoundryCombat>;
  rollAll(options?: RollInitiativeOptions): Promise<FoundryCombat>;
  rollNPC(options?: RollInitiativeOptions): Promise<FoundryCombat>;
  setInitiative(id: string, value: number): Promise<void>;
}

export interface FoundryCombatantCreateData {
  actorId: string;
  tokenId?: string;
  initiative?: number;
  hidden?: boolean;
}

export interface FoundryCombatCreateData {
  scene?: string;
}

export interface CombatConstructor {
  create(data?: FoundryCombatCreateData): Promise<FoundryCombat>;
}

export interface FoundryCombatsCollection {
  get(id: string): FoundryCombat | undefined;
  active: FoundryCombat | null;
}

export interface FoundryGame {
  combat: FoundryCombat | null;
  combats: FoundryCombatsCollection;
  scenes: {
    active: { id: string } | null;
  };
}

export function mapCombatantToResult(combatant: FoundryCombatant): CombatantResult {
  return {
    id: combatant.id,
    actorId: combatant.actorId,
    tokenId: combatant.tokenId,
    name: combatant.name,
    img: combatant.img,
    initiative: combatant.initiative,
    defeated: combatant.defeated,
    hidden: combatant.hidden
  };
}

export function mapCombatToResult(combat: FoundryCombat): CombatResult {
  return {
    id: combat.id,
    round: combat.round,
    turn: combat.turn,
    started: combat.started,
    combatants: combat.turns.map(mapCombatantToResult),
    current: combat.combatant ? mapCombatantToResult(combat.combatant) : null
  };
}

export function getActiveCombat(game: FoundryGame, combatId?: string): FoundryCombat {
  if (combatId) {
    const combat = game.combats.get(combatId);
    if (!combat) {
      throw new Error(`Combat not found: ${combatId}`);
    }
    return combat;
  }

  const activeCombat = game.combat;
  if (!activeCombat) {
    throw new Error('No active combat');
  }
  return activeCombat;
}

export function getCombatant(combat: FoundryCombat, combatantId: string): FoundryCombatant {
  const combatant = combat.combatants.get(combatantId);
  if (!combatant) {
    throw new Error(`Combatant not found: ${combatantId}`);
  }
  return combatant;
}