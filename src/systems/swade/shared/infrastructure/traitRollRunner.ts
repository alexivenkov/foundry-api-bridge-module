import { RollResolutionError } from '@/systems/shared/domain/errors';
import type { SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import { speakerFor, wildDieClassOf } from './chat';
import type {
  FoundrySwadeActor,
  FoundrySwadeGame,
  FoundrySwadeRollModifier,
  FoundrySwadeTraitRoll
} from './foundrySwadeTypes';
import { toTraitRollOutcome } from './traitRollMapper';

export const ROLL_CANCELLED = 'Roll was cancelled by a module hook';

export interface CompleteTraitRollContext {
  readonly actor: FoundrySwadeActor;
  readonly tokenId: string | undefined;
  readonly trait: string;
  readonly targetNumber: number;
  readonly showInChat: boolean;
  readonly flavor: string;
}

/**
 * Finish a trait roll the system built headlessly (`suppressChat: true`): set
 * the target number, evaluate without any dialog, map it, and post the
 * system's own chat card when asked.
 */
export async function completeTraitRoll(
  game: FoundrySwadeGame,
  roll: FoundrySwadeTraitRoll | null,
  context: CompleteTraitRollContext
): Promise<SwadeTraitRollOutcome> {
  if (!roll) {
    throw new RollResolutionError(ROLL_CANCELLED);
  }
  roll.targetNumber = context.targetNumber;
  await roll.evaluate({ allowInteractive: false });

  const outcome = toTraitRollOutcome(roll, {
    actorId: context.actor.id,
    ...(context.tokenId !== undefined ? { tokenId: context.tokenId } : {}),
    trait: context.trait,
    wildDieClass: wildDieClassOf(game)
  });
  if (!context.showInChat) {
    return outcome;
  }

  const messageData: Record<string, unknown> = { flavor: context.flavor };
  const speaker = speakerFor(context.actor);
  if (speaker) {
    messageData['speaker'] = speaker;
  }
  const message = await roll.toMessage(messageData);
  const messageId = message?.id;
  return typeof messageId === 'string' ? { ...outcome, messageId } : outcome;
}

/** The caller's one-off modifier, when there is one worth adding. */
export function callerModifier(
  modifier: number | string | undefined,
  label: string | undefined
): FoundrySwadeRollModifier | undefined {
  if (modifier === undefined || modifier === 0 || modifier === '') {
    return undefined;
  }
  return { label: label ?? 'Modifier', value: modifier };
}
