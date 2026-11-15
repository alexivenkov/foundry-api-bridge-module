import { isV14Plus } from '@/compat/foundryVersion';
import type { ChatVisibility } from '@/core/chat/domain';
import type { FoundryChatMessageClass, FoundryChatMessageData } from './foundryChatTypes';
import type { FoundryRollMessageOptions } from './foundryRollTypes';

// CONST.DICE_ROLL_MODES, verified against Foundry 13.351. Foundry 14.368 keeps
// them only as deprecated aliases: a visibility there is a key of
// CONFIG.ChatMessage.modes (public, gm, blind, self, ic), the domain's own word.
const ROLL_MODE: Readonly<Record<ChatVisibility, string>> = {
  public: 'publicroll',
  gm: 'gmroll',
  blind: 'blindroll',
  self: 'selfroll'
};

/**
 * Lets the core write `whisper` and `blind` into new message data, as it does
 * for a roll: `ChatMessage.applyMode` since Foundry 14, `applyRollMode` before.
 */
export function applyFoundryVisibility(
  ChatMessage: FoundryChatMessageClass,
  data: FoundryChatMessageData,
  visibility: ChatVisibility
): void {
  if (isV14Plus()) {
    if (ChatMessage.applyMode === undefined) {
      throw new Error('ChatMessage.applyMode is missing');
    }
    ChatMessage.applyMode(data, visibility);
    return;
  }
  if (ChatMessage.applyRollMode === undefined) {
    throw new Error('ChatMessage.applyRollMode is missing');
  }
  ChatMessage.applyRollMode(data, ROLL_MODE[visibility]);
}

/** The option of `Roll#toMessage` that carries a visibility: `messageMode` since Foundry 14, `rollMode` before. */
export function toRollMessageOptions(visibility: ChatVisibility): FoundryRollMessageOptions {
  return isV14Plus() ? { messageMode: visibility } : { rollMode: ROLL_MODE[visibility] };
}
