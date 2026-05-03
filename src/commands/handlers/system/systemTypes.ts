export interface FoundryGameTime {
  worldTime: number;
  advance(seconds: number): Promise<number>;
  set(seconds: number): Promise<number>;
}

export interface FoundryGameSystem {
  time: FoundryGameTime;
  paused: boolean;
  togglePause(state: boolean, options?: { broadcast?: boolean }): boolean;
}

export interface FoundryNotifications {
  info(msg: string, options?: object): number;
  warn(msg: string, options?: object): number;
  error(msg: string, options?: object): number;
  success?(msg: string, options?: object): number;
}

export interface FoundryUi {
  notifications: FoundryNotifications;
}

export interface FoundryCanvas {
  animatePan(options: object): Promise<unknown>;
  ping(point: { x: number; y: number }, options?: object): Promise<unknown>;
}

export function getGame(): FoundryGameSystem {
  const g = (globalThis as { game?: FoundryGameSystem }).game;
  if (!g) {
    throw new Error('Game not available');
  }
  return g;
}

export function getUi(): FoundryUi {
  const u = (globalThis as { ui?: { notifications?: FoundryNotifications } }).ui;
  if (!u || !u.notifications) {
    throw new Error('UI notifications not available');
  }
  return { notifications: u.notifications };
}

export function getCanvas(): FoundryCanvas {
  const c = (globalThis as { canvas?: FoundryCanvas | null }).canvas;
  if (!c) {
    throw new Error('Canvas not available');
  }
  return c;
}
