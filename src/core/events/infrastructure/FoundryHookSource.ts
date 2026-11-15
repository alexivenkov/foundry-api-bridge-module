import type { GameEventListener, GameEventName, GameEventSource } from '@/core/events/domain';
import type { EventGlobalsProvider, FoundryEventGlobals } from './foundryEventTypes';
import { HOOK_BINDINGS, type HookBinding, type HookSourceState } from './hookBindings';

const fromGlobalThis: EventGlobalsProvider = () => globalThis as unknown as FoundryEventGlobals;

/**
 * Turns Foundry hooks into game events. A hook gets a listener only while an
 * event it feeds is watched: the first subscription registers it with
 * `Hooks.on`, the last unsubscription removes it with `Hooks.off`.
 */
export class FoundryHookSource implements GameEventSource {
  private readonly registered = new Map<string, number>();
  private readonly state: HookSourceState = { lastViewedSceneId: null };
  private watched: ReadonlySet<GameEventName> = new Set();
  private listener: GameEventListener | null = null;

  constructor(
    private readonly globals: EventGlobalsProvider = fromGlobalThis,
    private readonly bindings: readonly HookBinding[] = HOOK_BINDINGS
  ) {}

  watch(events: ReadonlySet<GameEventName>, listener: GameEventListener): void {
    this.watched = new Set(events);
    this.listener = listener;
    const needed = new Set(
      this.bindings.filter((binding) => binding.events.some((name) => this.watched.has(name))).map((b) => b.hook)
    );
    if (needed.size === this.registered.size && [...needed].every((hook) => this.registered.has(hook))) {
      return;
    }
    const { Hooks } = this.globals();
    for (const [hook, id] of [...this.registered]) {
      if (!needed.has(hook)) {
        Hooks.off(hook, id);
        this.registered.delete(hook);
      }
    }
    for (const binding of this.bindings) {
      if (needed.has(binding.hook) && !this.registered.has(binding.hook)) {
        this.registered.set(binding.hook, Hooks.on(binding.hook, (...args: unknown[]) => {
          this.handle(binding, args);
        }));
      }
    }
    if (this.registered.size === 0) {
      this.state.lastViewedSceneId = null;
    }
  }

  /** The hooks that have a listener now. */
  activeHooks(): string[] {
    return [...this.registered.keys()];
  }

  /** Never throws: a failing listener must not break the hook chain of the core or of other modules. */
  private handle(binding: HookBinding, args: readonly unknown[]): void {
    try {
      binding.handle(args, {
        emit: (event) => {
          if (this.watched.has(event.name)) {
            this.listener?.(event);
          }
        },
        state: this.state
      });
    } catch (error) {
      console.warn(`Foundry API Bridge | Event listener for hook '${binding.hook}' failed:`, error);
    }
  }
}
