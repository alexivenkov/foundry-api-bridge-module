import type { ChatMessageData, SimulateRollResult, ValidateRollFormulaResult } from '@/commands/types';
import {
  isWhisper,
  stripHtml,
  type ChatHistoryEntry,
  type ChatWorldGlobalsProvider,
  type DiceGlobalsProvider,
  type RollFormulaVerdict,
  type RollSimulation
} from '@/core/chat';

export interface ChatHandlerDependencies {
  globals?: ChatWorldGlobalsProvider;
}

export interface DiceHandlerDependencies {
  globals?: DiceGlobalsProvider;
}

/** Content goes out as plain text; `rolls` is reported only when there are any. */
export function toWireChatMessage({ message, rolls }: ChatHistoryEntry): ChatMessageData {
  const data: ChatMessageData = {
    id: message.id,
    timestamp: message.timestamp,
    author:
      message.author !== null
        ? { userId: message.author.id, name: message.author.name }
        : { userId: 'unknown', name: 'Unknown' },
    speaker: {
      alias: message.speaker.alias,
      actorId: message.speaker.actorId,
      tokenId: message.speaker.tokenId
    },
    content: stripHtml(message.content),
    flavor: message.flavor,
    style: message.style,
    isRoll: message.isRoll,
    whisper: [...message.whisper],
    isWhisper: isWhisper(message),
    blind: message.blind === true
  };

  if (rolls.length > 0) {
    data.rolls = rolls.map((roll) => ({ formula: roll.formula, total: roll.total }));
  }

  return data;
}

export function toWireRollFormulaVerdict(verdict: RollFormulaVerdict): ValidateRollFormulaResult {
  return {
    formula: verdict.formula,
    valid: verdict.valid,
    reason: verdict.reason,
    unresolvedReferences: [...verdict.unresolvedReferences]
  };
}

export function toWireRollSimulation(simulation: RollSimulation): SimulateRollResult {
  return {
    formula: simulation.formula,
    iterations: simulation.iterations,
    totals: [...simulation.totals],
    min: simulation.min,
    max: simulation.max,
    mean: simulation.mean
  };
}
