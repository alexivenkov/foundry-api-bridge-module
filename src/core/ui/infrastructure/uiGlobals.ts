import { CanvasUnavailableError, NotificationsUnavailableError } from '@/core/ui/domain';
import type { FoundryNotifications, FoundryStageGlobals, FoundryUi, FoundryViewCanvas } from './foundryUiTypes';

export type UiProvider = () => FoundryUi;
export type CanvasProvider = () => FoundryViewCanvas;
export type StageGlobalsProvider = () => FoundryStageGlobals;

export function readUi(): FoundryUi {
  const ui = (globalThis as { ui?: { notifications?: FoundryNotifications } }).ui;
  if (!ui?.notifications) {
    throw new NotificationsUnavailableError();
  }
  return { notifications: ui.notifications };
}

export function readCanvas(): FoundryViewCanvas {
  const canvas = (globalThis as { canvas?: FoundryViewCanvas | null }).canvas;
  if (!canvas) {
    throw new CanvasUnavailableError();
  }
  return canvas;
}

/** Reads `canvas` and `game` on every call; either may be missing before Foundry is ready. */
export function readStageGlobals(): FoundryStageGlobals {
  return globalThis as unknown as FoundryStageGlobals;
}
