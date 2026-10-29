import type { FoundrySwadeActor, FoundrySwadeGame } from './foundrySwadeTypes';

interface ChatMessageClassLike {
  getSpeaker(options: { actor: FoundrySwadeActor }): Record<string, unknown>;
}

/** `ChatMessage.getSpeaker({ actor })` when the Foundry global exists (it does not under Jest). */
export function speakerFor(actor: FoundrySwadeActor): Record<string, unknown> | undefined {
  const cls = (globalThis as { ChatMessage?: Partial<ChatMessageClassLike> }).ChatMessage;
  if (cls && typeof cls.getSpeaker === 'function') {
    return cls.getSpeaker({ actor });
  }
  return undefined;
}

/** The system's localized label when `game.i18n` knows the key, else the English fallback. */
export function localize(game: FoundrySwadeGame, key: string, fallback: string): string {
  const localized = game.i18n?.localize(key);
  if (localized === undefined || localized === '' || localized === key) {
    return fallback;
  }
  return localized;
}

export function wildDieClassOf(game: FoundrySwadeGame): unknown {
  return game.swade?.dice?.WildDie;
}

/** Settings may be unregistered when the system is older than expected; treat that as "off". */
export function settingFlag(game: FoundrySwadeGame, key: string): boolean {
  try {
    return game.settings?.get('swade', key) === true;
  } catch {
    return false;
  }
}
