import type { Clock, RequestIdGenerator } from '@/core/dialogs/domain';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 16;

export const systemClock: Clock = { now: () => Date.now() };

/**
 * Random ids from `crypto.getRandomValues`, which, unlike `randomUUID`, also
 * exists on a Foundry server reached over plain http.
 */
export const randomRequestIds: RequestIdGenerator = {
  next(): string {
    const bytes = new Uint8Array(ID_LENGTH);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length] ?? 'x').join('');
  }
};
