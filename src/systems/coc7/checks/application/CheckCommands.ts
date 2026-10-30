import type {
  Coc7ActorTarget,
  Coc7AttributeKey,
  Coc7CharacteristicCheck,
  Coc7CheckOptions
} from '@/systems/coc7/shared/domain';

export interface RollSkillCommand {
  readonly target: Coc7ActorTarget;
  readonly skill: string;
  readonly options: Coc7CheckOptions;
}

export interface RollCharacteristicCommand {
  readonly target: Coc7ActorTarget;
  readonly characteristic: Coc7CharacteristicCheck;
  readonly options: Coc7CheckOptions;
}

export interface RollAttributeCommand {
  readonly target: Coc7ActorTarget;
  readonly attribute: Coc7AttributeKey;
  readonly options: Coc7CheckOptions;
}
