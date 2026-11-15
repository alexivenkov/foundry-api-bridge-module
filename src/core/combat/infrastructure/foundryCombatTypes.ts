import type { FoundryBattlefieldScene } from './foundryBattlefieldTypes';

// Typed as the wire contract has always declared them. The core is looser in
// places — a combatant may have no actor (`actorId: null`), and `turn` is null
// while it is no one's turn — and such values go out exactly as they are read.

export interface FoundryCombatantToken {
  /** The scene the token is embedded in. */
  parent: { id: string } | null;
}

/** The Combatant fields the context reads and writes (`BaseCombatant` schema, Foundry 13–14). */
export interface FoundryCombatantDocument {
  id: string;
  actorId: string;
  tokenId: string | null;
  /** Prepared by the client document: its own name, else the token's or the actor's. */
  name: string;
  /** Prepared by the client document: its own image, else the token's or the actor's. */
  img: string;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
  /**
   * A getter of the client document: the token with `tokenId` on the
   * combatant's own scene (`sceneId`), else on the scene of the combat; null
   * when it is on neither.
   */
  token: FoundryCombatantToken | null;
  /**
   * Foundry 13+, absent before. Stored as a group id; the client document
   * replaces it with the group of the encounter it names, and keeps the bare id
   * when no such group exists (`Combatant#_prepareGroup`).
   */
  group?: { id: string } | string | null;
  /** Resolves to undefined when the update changes nothing; the document is updated in place. */
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryCombatantsCollection {
  get(id: string): FoundryCombatantDocument | undefined;
  contents: FoundryCombatantDocument[];
}

export interface FoundryInitiativeOptions {
  formula?: string | null;
}

/** The Combat fields and methods the context uses (`BaseCombat` schema and the client `Combat`, Foundry 13–14). */
export interface FoundryCombatDocument {
  id: string;
  round: number;
  turn: number;
  /** A getter of the client document: `round > 0`. */
  started: boolean;
  /** A getter of the client document: the combatant at `turn` of the turn order. */
  combatant: FoundryCombatantDocument | null | undefined;
  combatants: FoundryCombatantsCollection;
  /** The combatants in turn order, kept by the client document. */
  turns: FoundryCombatantDocument[];
  // Foundry 13–14 resolve these three to the combat itself. A core that passes
  // on what `update` resolves to gives nothing when the update is vetoed.
  startCombat(): Promise<FoundryCombatDocument | null | undefined>;
  nextTurn(): Promise<FoundryCombatDocument | null | undefined>;
  previousTurn(): Promise<FoundryCombatDocument | null | undefined>;
  delete(): Promise<unknown>;
  activate(): Promise<unknown>;
  update(data: Record<string, unknown>): Promise<unknown>;
  createEmbeddedDocuments(type: 'Combatant', data: Record<string, unknown>[]): Promise<FoundryCombatantDocument[]>;
  deleteEmbeddedDocuments(type: 'Combatant', ids: string[]): Promise<unknown[]>;
  rollInitiative(ids: string[], options?: FoundryInitiativeOptions): Promise<unknown>;
  /** Rolls for the combatants without initiative. */
  rollAll(options?: FoundryInitiativeOptions): Promise<unknown>;
  /** Rolls for the combatants without initiative that no player owns. */
  rollNPC(options?: FoundryInitiativeOptions): Promise<unknown>;
  setInitiative(id: string, value: number | null): Promise<unknown>;
}

export interface FoundryCombatClass {
  create(data: Record<string, unknown>): Promise<FoundryCombatDocument | null | undefined>;
}

export interface FoundryCombatGame {
  /** The encounter the combat tracker of this client shows; null when it shows none. */
  combat: FoundryCombatDocument | null | undefined;
  combats: { get(id: string): FoundryCombatDocument | undefined };
  /** `active` is undefined, not null, when no scene is active. */
  scenes: {
    active: { id: string } | null | undefined;
    get(id: string): FoundryBattlefieldScene | undefined;
  };
}
