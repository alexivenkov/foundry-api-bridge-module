import type { CardDrawMode, CardMoveOptions } from '@/core/cards/domain';
import type { FoundryCardMoveOptions } from './foundryCardsTypes';

// CONST.CARD_DRAW_MODES and CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER, verified
// against Foundry 13.351 and 14.368 (TOP = FIRST, BOTTOM = LAST).
const DRAW_MODE_CODE: Readonly<Record<CardDrawMode, number>> = { top: 0, bottom: 1, random: 2 };
const OWNER_LEVEL = 3;

export function drawModeToCode(mode: CardDrawMode): number {
  return DRAW_MODE_CODE[mode];
}

/** The users with the owner level; `default` is the level of everyone else, not a user. */
export function ownerIdsOf(ownership: Readonly<Record<string, number>> | null | undefined): string[] {
  return Object.entries(ownership ?? {})
    .filter(([userId, level]) => userId !== 'default' && level === OWNER_LEVEL)
    .map(([userId]) => userId);
}

/** Face down is `face: null`, as the core's deal and draw dialogs lay cards face down. */
export function toFoundryMoveOptions(options: CardMoveOptions): FoundryCardMoveOptions {
  const foundryOptions: FoundryCardMoveOptions = {};
  if (options.facing !== undefined) {
    foundryOptions.updateData = { face: options.facing === 'down' ? null : 0 };
  }
  if (options.chatNotification !== undefined) {
    foundryOptions.chatNotification = options.chatNotification;
  }
  return foundryOptions;
}
