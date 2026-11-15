import type { ChatStyle, SpokenStyle } from '@/core/chat/domain';
import type { FoundryChatConstants, FoundryChatMessageData, FoundryChatStyleCodes } from './foundryChatTypes';

// CONST.CHAT_MESSAGE_STYLES, verified against Foundry 13.351 and 14.368.
const STYLE_BY_CODE: Readonly<Record<number, ChatStyle>> = { 0: 'other', 1: 'ooc', 2: 'ic', 3: 'emote' };

export function chatStyleFromCode(code: number): ChatStyle {
  return STYLE_BY_CODE[code] ?? 'other';
}

const STYLE_KEY: Readonly<Record<SpokenStyle, keyof FoundryChatStyleCodes>> = { ic: 'IC', ooc: 'OOC', emote: 'EMOTE' };

/**
 * The field a new message carries its style in, with the code from the core's
 * own table: `style` and `CONST.CHAT_MESSAGE_STYLES` since Foundry 12 (verified
 * on 13.351 and 14.368). Foundry 11 kept the style in the numeric `type` with
 * `CONST.CHAT_MESSAGE_TYPES`; that table is consulted only when the newer one
 * is missing, because 14 rejects a numeric `type`.
 */
export function toFoundryStyleData(
  style: SpokenStyle,
  constants: FoundryChatConstants | undefined
): Pick<FoundryChatMessageData, 'style' | 'type'> {
  const key = STYLE_KEY[style];
  const styles = constants?.CHAT_MESSAGE_STYLES;
  if (styles !== undefined) {
    return { style: styles[key] };
  }
  const types = constants?.CHAT_MESSAGE_TYPES;
  return types !== undefined ? { type: types[key] } : {};
}
