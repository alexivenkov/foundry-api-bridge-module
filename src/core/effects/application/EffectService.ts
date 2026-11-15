import { refuseNewScriptCarriers } from '@/kernel';
import {
  requireActor,
  type ActorIdentity,
  type ActorLocator,
  type ActorTarget,
  type LocatedActor,
  type SceneLocator
} from '@/core/shared';
import {
  EffectCreationFailedError,
  EffectNotFoundError,
  assertEffectWrite,
  type Effect,
  type EffectEnvironment,
  type EffectIdentity,
  type EffectStore,
  type ScriptCarrierPolicy,
  type StatusToggle
} from '@/core/effects/domain';
import type {
  AddEffectCommand,
  ListEffectsQuery,
  RemoveEffectCommand,
  ToggleStatusCommand,
  UpdateEffectCommand
} from './commands';

export interface EffectServiceDependencies {
  readonly scenes: SceneLocator;
  readonly actors: ActorLocator;
  readonly effects: EffectStore;
  readonly environment: EffectEnvironment;
  /** Absent: effect data that automation modules run is refused. */
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

const NO_SCRIPTS: ScriptCarrierPolicy = { allowsScripts: () => false };

export interface ActorEffectsResult {
  readonly actor: ActorIdentity;
  readonly effects: readonly Effect[];
  readonly activeStatuses: readonly string[];
}

export interface StatusToggleResult {
  readonly actorId: string;
  readonly statusId: string;
  readonly toggle: StatusToggle;
}

export interface EffectWriteResult {
  readonly actorId: string;
  readonly effect: EffectIdentity;
}

export interface EffectRemovalResult {
  readonly actorId: string;
  readonly effectId: string;
}

/**
 * Effects and statuses of one actor: a world actor, or one token's own actor —
 * an unlinked token keeps its effects to itself.
 */
export class EffectService {
  constructor(private readonly deps: EffectServiceDependencies) {}

  listEffects(query: ListEffectsQuery): ActorEffectsResult {
    const actor = this.requireActor(query.target);
    const { effects, activeStatuses } = this.deps.effects.readEffects(actor.ref);
    return {
      actor: { id: actor.id, name: actor.name },
      effects: query.includeDisabled ? effects : effects.filter((effect) => !effect.disabled),
      activeStatuses
    };
  }

  async toggleStatus(command: ToggleStatusCommand): Promise<StatusToggleResult> {
    const actor = this.requireActor(command.target);
    const toggle = await this.deps.effects.toggleStatus(actor.ref, command.statusId, command.options);
    return { actorId: actor.id, statusId: command.statusId, toggle };
  }

  /** `origin` is not checked here: the command has always handed it to the core as given. */
  async addEffect(command: AddEffectCommand): Promise<EffectWriteResult> {
    const actor = this.requireActor(command.target);
    const { type, system, showIcon } = command.draft;
    assertEffectWrite({ type, system, showIcon }, this.deps.environment);
    refuseNewScriptCarriers('ActiveEffect', command.draft, () => this.allowsScripts());
    const effect = await this.deps.effects.createEffect(actor.ref, command.draft);
    if (effect === null) {
      throw new EffectCreationFailedError();
    }
    return { actorId: actor.id, effect };
  }

  async updateEffect(command: UpdateEffectCommand): Promise<EffectWriteResult> {
    const actor = this.requireActor(command.target);
    const { system, showIcon, origin } = command.changes;
    assertEffectWrite({ system, showIcon, origin }, this.deps.environment);
    refuseNewScriptCarriers(
      'ActiveEffect',
      command.changes,
      () => this.allowsScripts(),
      () => this.requireStoredEffect(actor, command.effectId)
    );
    const effect = await this.deps.effects.updateEffect(actor.ref, command.effectId, command.changes);
    if (effect === null) {
      throw new EffectNotFoundError(command.effectId);
    }
    return { actorId: actor.id, effect };
  }

  async removeEffect(command: RemoveEffectCommand): Promise<EffectRemovalResult> {
    const actor = this.requireActor(command.target);
    if (!this.deps.effects.hasEffect(actor.ref, command.effectId)) {
      throw new EffectNotFoundError(command.effectId);
    }
    await this.deps.effects.deleteEffect(actor.ref, command.effectId);
    return { actorId: actor.id, effectId: command.effectId };
  }

  private requireActor(target: ActorTarget): LocatedActor {
    return requireActor(this.deps.scenes, this.deps.actors, target);
  }

  private requireStoredEffect(actor: LocatedActor, effectId: string): Effect {
    const effect = this.deps.effects.readEffects(actor.ref).effects.find((candidate) => candidate.id === effectId);
    if (effect === undefined) {
      throw new EffectNotFoundError(effectId);
    }
    return effect;
  }

  private allowsScripts(): boolean {
    return (this.deps.scripts ?? NO_SCRIPTS).allowsScripts();
  }
}
