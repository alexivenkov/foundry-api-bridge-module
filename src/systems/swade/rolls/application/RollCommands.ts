import type { SwadeActorTarget } from '@/systems/swade/shared/domain';

export interface RollAttributeCommand {
  readonly target: SwadeActorTarget;
  readonly attribute: string;
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly targetNumber: number;
  readonly ignoreWounds: boolean;
  readonly showInChat: boolean;
}

export interface RollSkillCommand {
  readonly target: SwadeActorTarget;
  readonly skill: string;
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly targetNumber: number;
  readonly ignoreWounds: boolean;
  readonly unskilled: boolean;
  readonly showInChat: boolean;
}

export interface RollAttackCommand {
  readonly target: SwadeActorTarget;
  readonly itemId: string;
  readonly targetTokenId: string | undefined;
  readonly targetNumber: number | undefined;
  readonly modifier: number | undefined;
  readonly modifierLabel: string | undefined;
  readonly showInChat: boolean;
}

export interface RollDamageCommand {
  readonly target: SwadeActorTarget;
  readonly itemId: string;
  readonly raise: boolean;
  readonly modifier: number | string | undefined;
  readonly modifierLabel: string | undefined;
  readonly ap: number | undefined;
  readonly targetTokenId: string | undefined;
  readonly showInChat: boolean;
}
