import type { FoundryActorLike, FoundryActorsGame } from '@/core/shared';
import type { FoundryChatSpeaker, FoundryChatSpeakerGlobals } from './foundryChatTypes';

export interface FoundryDieResult {
  result: number;
  /** False for a die dropped by a keep / drop modifier; absent on older data. */
  active?: boolean;
}

/** A term of an evaluated roll. Only dice terms carry `faces` and `results`. */
export interface FoundryRollTerm {
  faces?: number;
  number?: number;
  results?: FoundryDieResult[];
}

export interface FoundryRollMessageData {
  flavor?: string | null;
  speaker?: FoundryChatSpeaker;
}

/** The visibility option of `Roll#toMessage`: `rollMode` up to Foundry 13, `messageMode` since 14. */
export interface FoundryRollMessageOptions {
  rollMode?: string;
  messageMode?: string;
}

export interface FoundryRoll {
  evaluate(): Promise<unknown>;
  toMessage(messageData?: FoundryRollMessageData, options?: FoundryRollMessageOptions): Promise<unknown>;
  total: number;
  formula: string;
  terms: FoundryRollTerm[];
  /** The dice terms of the parsed formula, available before evaluation. */
  dice?: Array<{ number?: unknown }>;
}

/** The core keeps the data object it is given and only reads it. */
export type FoundryRollConstructor = new (formula: string, data?: object) => FoundryRoll;

/** The static side of the core's `Roll` (Foundry 13.351 and 14.368). */
export interface FoundryRollStatics {
  /** Data references count as 1; the formula is parsed and evaluated without rolling any die. */
  validate(formula: string): boolean;
  /** Async since Foundry 12; logs a summary line to the console. */
  simulate(formula: string, n: number): Promise<number[]> | number[];
  /** Without `missing`, a reference the data does not set is left in place. */
  replaceFormulaData(formula: string, data: object, options?: { missing?: string }): string;
}

export interface FoundryRollGlobals {
  Roll: FoundryRollConstructor;
}

export type RollGlobalsProvider = () => FoundryRollGlobals;

export interface FoundryRollFormulaGlobals {
  Roll: FoundryRollStatics;
}

export type RollFormulaGlobalsProvider = () => FoundryRollFormulaGlobals;

export interface FoundryRollDataActor extends FoundryActorLike {
  /** The core's own returns the actor's live `system` data; a system may build a new object. */
  getRollData(): unknown;
}

export type FoundryRollDataGame = FoundryActorsGame<FoundryRollDataActor>;

/** Everything the composed dice service reads. */
export interface FoundryDiceGlobals extends FoundryRollGlobals, FoundryChatSpeakerGlobals {
  Roll: FoundryRollConstructor & FoundryRollStatics;
  game: FoundryRollDataGame;
}

export type DiceGlobalsProvider = () => FoundryDiceGlobals;
