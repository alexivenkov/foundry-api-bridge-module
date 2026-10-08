/** Which client-side dialog interrupted an activation. */
export type UserDialogKind = 'attack-roll' | 'consume' | 'damage' | 'other';

/**
 * A watch armed BEFORE the item is used. `awaitDialog()` resolves as soon as
 * a dnd5e or Midi-QOL dialog renders and waits for a human; `cancel()` stops
 * watching.
 */
export interface DialogWatch {
  awaitDialog(): Promise<UserDialogKind>;
  cancel(): void;
}

export interface DialogWatchPort {
  watch(): DialogWatch;
}
