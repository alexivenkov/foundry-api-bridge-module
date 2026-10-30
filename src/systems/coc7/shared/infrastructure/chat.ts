import type { FoundryRollLike } from './dice';
import type { FoundryCoc7Actor, FoundryCoc7Game, FoundryCoc7Token } from './foundryCoc7Types';

export const COC7_SETTINGS_SCOPE = 'CoC7';

interface ChatMessageClassLike {
  getSpeaker(options: { actor: FoundryCoc7Actor; token?: FoundryCoc7Token }): Record<string, unknown>;
  getWhisperRecipients?(name: string): Array<{ id: string }>;
  create(data: Record<string, unknown>): Promise<{ id?: string | null } | null | undefined>;
}

function chatMessageClass(): Partial<ChatMessageClassLike> | undefined {
  return (globalThis as { ChatMessage?: Partial<ChatMessageClassLike> }).ChatMessage;
}

/** `ChatMessage.getSpeaker({ actor, token })` when the Foundry global exists (it does not under Jest). */
export function speakerFor(actor: FoundryCoc7Actor, token: FoundryCoc7Token | undefined): Record<string, unknown> | undefined {
  const cls = chatMessageClass();
  if (cls && typeof cls.getSpeaker === 'function') {
    return cls.getSpeaker(token !== undefined ? { actor, token } : { actor });
  }
  return undefined;
}

/** Settings may be unregistered when the system is older than expected; treat that as "off" / unset. */
export function settingFlag(game: FoundryCoc7Game, key: string): boolean {
  try {
    return game.settings?.get(COC7_SETTINGS_SCOPE, key) === true;
  } catch {
    return false;
  }
}

export function settingValue(game: FoundryCoc7Game, key: string): unknown {
  try {
    return game.settings?.get(COC7_SETTINGS_SCOPE, key);
  } catch {
    return undefined;
  }
}

export function gmUserIds(game: FoundryCoc7Game): string[] {
  const cls = chatMessageClass();
  if (cls && typeof cls.getWhisperRecipients === 'function') {
    return cls.getWhisperRecipients('GM').map((user) => user.id);
  }
  const users = game.users;
  if (users) {
    if (typeof users.filter === 'function') {
      return users.filter((user) => user.isGM).map((user) => user.id);
    }
    return (users.contents ?? []).filter((user) => user.isGM).map((user) => user.id);
  }
  return [];
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Enriched HTML from the system's tables, flattened to text for the wire. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export interface Coc7CardSpec {
  readonly actor: FoundryCoc7Actor;
  readonly token: FoundryCoc7Token | undefined;
  readonly title: string;
  readonly lines: readonly string[];
  readonly rolls: readonly FoundryRollLike[];
  readonly blind: boolean;
}

/**
 * The module's own card: the system's check cards cannot be built from
 * outside, so a check posts plain HTML with the dice attached in `rolls`
 * (Dice So Nice animates them). `blind` whispers it to the GMs.
 */
export async function postCoc7Card(game: FoundryCoc7Game, spec: Coc7CardSpec): Promise<string | undefined> {
  const cls = chatMessageClass();
  if (!cls || typeof cls.create !== 'function') {
    return undefined;
  }
  const body = spec.lines.map((line) => `<div class="coc7-card-line">${escapeHtml(line)}</div>`).join('');
  const content = `<div class="foundry-api-bridge coc7-card"><h3>${escapeHtml(spec.title)}</h3>${body}</div>`;
  const data: Record<string, unknown> = { content, rolls: [...spec.rolls] };
  const speaker = speakerFor(spec.actor, spec.token);
  if (speaker) {
    data['speaker'] = speaker;
  }
  if (spec.blind) {
    data['whisper'] = gmUserIds(game);
    data['blind'] = true;
  }
  const message = await cls.create(data);
  const id = message?.id;
  return typeof id === 'string' ? id : undefined;
}
