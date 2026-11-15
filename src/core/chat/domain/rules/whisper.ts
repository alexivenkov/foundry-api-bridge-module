import { VisibilityConflictsWithWhisperError } from '@/core/chat/domain/errors/chatErrors';
import type { ChatVisibility } from '@/core/chat/domain/model/ChatVisibility';

/** Every recipient once, in the order first named. */
export function mergeRecipients(...lists: readonly (readonly string[])[]): string[] {
  return [...new Set(lists.flat())];
}

/**
 * The core would quietly show a `public` whisper to everyone and turn a `self`
 * one into a note to the author, so neither is accepted with recipients.
 * `gm` and `blind` keep the recipients, as the core does.
 */
export function assertVisibilityFitsRecipients(
  visibility: ChatVisibility | undefined,
  recipients: readonly string[]
): void {
  if ((visibility === 'public' || visibility === 'self') && recipients.length > 0) {
    throw new VisibilityConflictsWithWhisperError(visibility);
  }
}
