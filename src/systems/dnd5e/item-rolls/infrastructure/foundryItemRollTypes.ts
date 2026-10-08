export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number; active?: boolean }>;
}

export interface FoundryD20Roll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical: boolean;
  isFumble: boolean;
  options?: { advantageMode?: number };
}

export interface FoundryDamageRoll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
}

export interface RollDialogConfig {
  configure: boolean;
}

export interface RollMessageConfig {
  create: boolean;
}

/**
 * Midi-QOL rebuilds `advantage` from its own tracker before calling dnd5e, so a
 * plain `config.advantage` is ignored while Midi is active. The tracker reads
 * `workflowOptions.advantage/disadvantage` (verified against midi-qol 14.0.13,
 * `Workflow#checkAttackAdvantage`); `midiOptions.advantage` is the pre-computed
 * source Midi's roll helpers accept.
 */
export interface MidiAdvantageOptions {
  advantage?: boolean;
  disadvantage?: boolean;
  workflowOptions?: { advantage?: boolean; disadvantage?: boolean };
}

export interface AttackRollConfig {
  advantage?: boolean;
  disadvantage?: boolean;
  midiOptions?: MidiAdvantageOptions;
}

export interface DamageRollConfig {
  isCritical?: boolean;
}

export interface FoundryAttackActivity {
  _id: string;
  type: string;
  rollAttack(
    config?: AttackRollConfig,
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryD20Roll[] | null>;
  rollDamage(
    config?: DamageRollConfig,
    dialog?: RollDialogConfig,
    message?: RollMessageConfig
  ): Promise<FoundryDamageRoll[] | null>;
}

export interface FoundryActivitiesCollection {
  find(
    predicate: (activity: FoundryAttackActivity) => boolean
  ): FoundryAttackActivity | undefined;
}

export interface FoundryItemSystem {
  activities?: FoundryActivitiesCollection;
}

export interface FoundryItem {
  id: string;
  name: string;
  type: string;
  system: FoundryItemSystem;
}

export interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

export interface FoundryItemRollActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
}

export interface FoundryItemRollActorsCollection {
  get(id: string): FoundryItemRollActor | undefined;
}

export interface FoundryItemRollGame {
  actors: FoundryItemRollActorsCollection;
  modules?: { get(id: string): { active: boolean } | undefined };
}

export function isMidiQolActive(game: FoundryItemRollGame): boolean {
  return game.modules?.get('midi-qol')?.active ?? false;
}
