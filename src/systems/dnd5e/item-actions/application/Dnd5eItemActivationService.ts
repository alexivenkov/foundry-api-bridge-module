import type {
  ActivationUseOutcome,
  ActivityUsedInfo,
  ItemActivationOutcome,
  ItemActivationPort,
  MidiWorkflowOutcome,
  MidiWorkflowPort,
  TargetingPort
} from '@/systems/dnd5e/item-actions/domain';
import type { ActivateItemCommand } from './ItemActionCommands';

interface MutableItemActivationOutcome {
  itemId: string;
  itemName: string;
  itemType: string;
  activated: boolean;
  targetsSet: number;
  rolls: ActivationUseOutcome['rolls'];
  activityUsed?: ActivityUsedInfo;
  chatMessageId?: string;
  workflow?: MidiWorkflowOutcome;
}

/**
 * Orchestrates the load-bearing ordering of an item activation:
 *   set targets -> arm Midi capture (before use) -> activate -> await capture.
 */
export class Dnd5eItemActivationService {
  constructor(
    private readonly activation: ItemActivationPort,
    private readonly targeting: TargetingPort,
    private readonly midi: MidiWorkflowPort
  ) {}

  async activate(command: ActivateItemCommand): Promise<ItemActivationOutcome> {
    const targetsSet =
      command.targetTokenIds.length > 0 ? this.targeting.setTargets(command.targetTokenIds) : 0;

    const capture = this.midi.isActive() ? this.midi.captureNext() : undefined;

    let used: ActivationUseOutcome;
    try {
      used = await this.activation.activate(command.actorId, command.itemId, {
        activityId: command.activityId,
        activityType: command.activityType,
        templatePosition: command.templatePosition,
        spellLevel: command.spellLevel
      });
    } catch (error) {
      capture?.cancel();
      throw error;
    }

    const workflow = capture ? await capture.await() : undefined;

    const outcome: MutableItemActivationOutcome = {
      itemId: used.itemId,
      itemName: used.itemName,
      itemType: used.itemType,
      activated: true,
      targetsSet,
      rolls: used.rolls
    };
    if (used.activityUsed) {
      outcome.activityUsed = used.activityUsed;
    }
    if (used.chatMessageId !== undefined) {
      outcome.chatMessageId = used.chatMessageId;
    }
    if (workflow) {
      outcome.workflow = workflow;
    }
    return outcome;
  }
}
