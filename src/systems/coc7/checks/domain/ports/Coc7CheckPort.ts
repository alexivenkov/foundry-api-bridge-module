import type {
  Coc7ActorTarget,
  Coc7AttributeKey,
  Coc7CharacteristicCheck,
  Coc7CheckOptions,
  Coc7CheckOutcome
} from '@/systems/coc7/shared/domain';

export interface RollSkillOptions {
  /** Skill item id, name or CoC ID. */
  readonly skill: string;
  readonly options: Coc7CheckOptions;
}

export interface RollCharacteristicOptions {
  readonly characteristic: Coc7CharacteristicCheck;
  readonly options: Coc7CheckOptions;
}

export interface RollAttributeOptions {
  readonly attribute: Coc7AttributeKey;
  readonly options: Coc7CheckOptions;
}

/** Outbound port for CoC7 d100 checks: the module rolls the pool itself, the system only supplies the values. */
export interface Coc7CheckPort {
  rollSkill(target: Coc7ActorTarget, options: RollSkillOptions): Promise<Coc7CheckOutcome>;
  rollCharacteristic(target: Coc7ActorTarget, options: RollCharacteristicOptions): Promise<Coc7CheckOutcome>;
  rollAttribute(target: Coc7ActorTarget, options: RollAttributeOptions): Promise<Coc7CheckOutcome>;
}
