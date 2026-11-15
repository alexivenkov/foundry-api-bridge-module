import type { FoundryEventGlobals, FoundryHooks } from '../foundryEventTypes';

/** The `Hooks` registry as Foundry 13–14 implement it (client/helpers/hooks.mjs), minus the error reporting. */
export class FakeHooks implements FoundryHooks {
  private nextId = 1;
  private readonly entries = new Map<number, { hook: string; fn: (...args: unknown[]) => unknown }>();

  on(hook: string, fn: (...args: unknown[]) => unknown): number {
    const id = this.nextId++;
    this.entries.set(id, { hook, fn });
    return id;
  }

  off(_hook: string, id: number): void {
    this.entries.delete(id);
  }

  callAll(hook: string, ...args: unknown[]): void {
    for (const entry of [...this.entries.values()]) {
      if (entry.hook === hook) {
        entry.fn(...args);
      }
    }
  }

  /** Stops at the first listener that returns false, as `Hooks.call` does. */
  call(hook: string, ...args: unknown[]): boolean {
    for (const entry of [...this.entries.values()]) {
      if (entry.hook === hook && entry.fn(...args) === false) {
        return false;
      }
    }
    return true;
  }

  registeredHooks(): string[] {
    return [...this.entries.values()].map((entry) => entry.hook).sort();
  }
}

export function globalsWith(hooks: FakeHooks): () => FoundryEventGlobals {
  return () => ({ Hooks: hooks });
}
