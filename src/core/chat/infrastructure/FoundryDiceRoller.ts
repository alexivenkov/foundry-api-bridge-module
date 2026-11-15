import { globalGameProvider } from '@/core/shared';
import type { DiceRoll, DiceRoller, PreparedRoll, RollDataSpec, RollPostOptions } from '@/core/chat/domain';
import { toFoundrySpeaker } from './chatMessageMapper';
import { toRollMessageOptions } from './chatVisibilityCodes';
import { FoundryRollData } from './FoundryRollData';
import type { FoundryRoll, FoundryRollDataGame, FoundryRollMessageData, RollGlobalsProvider } from './foundryRollTypes';
import { readDiceCounts, toDiceRoll } from './rollMapper';

class FoundryPreparedRoll implements PreparedRoll {
  readonly diceCounts: readonly (number | null)[];

  constructor(private readonly foundryRoll: FoundryRoll) {
    this.diceCounts = readDiceCounts(foundryRoll);
  }

  async roll(): Promise<DiceRoll> {
    await this.foundryRoll.evaluate();
    return toDiceRoll(this.foundryRoll);
  }

  async post(flavor: string | null | undefined, options?: RollPostOptions): Promise<void> {
    const messageData: FoundryRollMessageData = flavor !== undefined ? { flavor } : {};
    if (options?.speaker !== undefined) {
      messageData.speaker = toFoundrySpeaker(options.speaker);
    }
    await (options?.visibility !== undefined
      ? this.foundryRoll.toMessage(messageData, toRollMessageOptions(options.visibility))
      : this.foundryRoll.toMessage(messageData));
  }
}

/** Anti-corruption layer over the core's `Roll`. */
export class FoundryDiceRoller implements DiceRoller {
  constructor(
    private readonly globals: RollGlobalsProvider,
    private readonly rollData: FoundryRollData = new FoundryRollData(globalGameProvider<FoundryRollDataGame>())
  ) {}

  prepare(formula: string, data?: RollDataSpec): PreparedRoll {
    const { Roll } = this.globals();
    const roll = data === undefined ? new Roll(formula) : new Roll(formula, this.rollData.materialize(data));
    return new FoundryPreparedRoll(roll);
  }
}
