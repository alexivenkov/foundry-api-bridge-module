export interface FoundryDiceTerm {
  faces?: number;
  number?: number;
  results?: Array<{ result: number }>;
}

export interface FoundryD20Roll {
  total: number;
  formula: string;
  terms: FoundryDiceTerm[];
  isCritical: boolean;
  isFumble: boolean;
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

export interface AttackRollConfig {
  advantage?: boolean;
  disadvantage?: boolean;
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
}
