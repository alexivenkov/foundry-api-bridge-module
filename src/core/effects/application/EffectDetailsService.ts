import { refuseNewScriptCarriers } from '@/kernel';
import { requireActor, type ActorLocator, type LocatedActor, type SceneLocator } from '@/core/shared';
import {
  EffectCreationFailedError,
  EffectItemNotFoundError,
  EffectNotFoundError,
  assertEffectWrite,
  type EffectDetails,
  type EffectDocumentStore,
  type EffectEnvironment,
  type EffectItemIdentity,
  type ItemEffectHost,
  type ScriptCarrierPolicy
} from '@/core/effects/domain';
import type {
  CreateItemEffectCommand,
  DeleteItemEffectCommand,
  GetActorEffectQuery,
  ItemEffectTarget,
  ListItemEffectsQuery,
  UpdateItemEffectCommand
} from './commands';

export interface EffectDetailsServiceDependencies {
  readonly scenes: SceneLocator;
  readonly actors: ActorLocator;
  readonly documents: EffectDocumentStore;
  readonly environment: EffectEnvironment;
  /** Absent: effect data that automation modules run is refused. */
  readonly scripts?: ScriptCarrierPolicy | undefined;
}

const NO_SCRIPTS: ScriptCarrierPolicy = { allowsScripts: () => false };

export interface ActorEffectDetailsResult {
  readonly actor: LocatedActor;
  readonly effect: EffectDetails;
}

/** Where an item-effect command acted. `owner` is null for a world item. */
export interface ItemEffectLocation {
  readonly item: EffectItemIdentity;
  readonly owner: LocatedActor | null;
}

export interface ItemEffectsResult extends ItemEffectLocation {
  readonly effects: readonly EffectDetails[];
}

export interface ItemEffectWriteResult extends ItemEffectLocation {
  readonly effect: EffectDetails;
}

export interface ItemEffectRemovalResult extends ItemEffectLocation {
  readonly effectId: string;
}

interface ResolvedItem extends ItemEffectLocation {
  readonly host: ItemEffectHost;
}

/**
 * Effects as full snapshots: one effect of an actor, and the effects of an
 * item — a world item, or an item that a world actor or one token's own actor
 * owns.
 */
export class EffectDetailsService {
  constructor(private readonly deps: EffectDetailsServiceDependencies) {}

  getActorEffect(query: GetActorEffectQuery): ActorEffectDetailsResult {
    const actor = requireActor(this.deps.scenes, this.deps.actors, query.target);
    const effect = this.deps.documents.findEffect({ kind: 'actor', actor: actor.ref }, query.effectId);
    if (effect === null) {
      throw new EffectNotFoundError(query.effectId);
    }
    return { actor, effect };
  }

  listItemEffects(query: ListItemEffectsQuery): ItemEffectsResult {
    const { host, ...location } = this.resolveItem(query.item);
    return { ...location, effects: this.deps.documents.listEffects(host) };
  }

  async createItemEffect(command: CreateItemEffectCommand): Promise<ItemEffectWriteResult> {
    const { host, ...location } = this.resolveItem(command.item);
    assertEffectWrite(command.draft, this.deps.environment);
    refuseNewScriptCarriers('ActiveEffect', command.draft, () => this.allowsScripts());
    const effect = await this.deps.documents.createEffect(host, command.draft);
    if (effect === null) {
      throw new EffectCreationFailedError();
    }
    return { ...location, effect };
  }

  async updateItemEffect(command: UpdateItemEffectCommand): Promise<ItemEffectWriteResult> {
    const { host, ...location } = this.resolveItem(command.item);
    this.requireEffect(host, command.effectId);
    assertEffectWrite(command.changes, this.deps.environment);
    refuseNewScriptCarriers(
      'ActiveEffect',
      command.changes,
      () => this.allowsScripts(),
      () => this.deps.documents.findEffect(host, command.effectId)
    );
    const effect = await this.deps.documents.updateEffect(host, command.effectId, command.changes);
    if (effect === null) {
      throw new EffectNotFoundError(command.effectId);
    }
    return { ...location, effect };
  }

  async deleteItemEffect(command: DeleteItemEffectCommand): Promise<ItemEffectRemovalResult> {
    const { host, ...location } = this.resolveItem(command.item);
    this.requireEffect(host, command.effectId);
    await this.deps.documents.deleteEffect(host, command.effectId);
    return { ...location, effectId: command.effectId };
  }

  private resolveItem(target: ItemEffectTarget): ResolvedItem {
    const owner = target.owner === null ? null : requireActor(this.deps.scenes, this.deps.actors, target.owner);
    const host: ItemEffectHost = { kind: 'item', itemId: target.itemId, actor: owner?.ref ?? null };
    const item = this.deps.documents.findItem(host);
    if (item === null) {
      throw new EffectItemNotFoundError(target.itemId);
    }
    return { host, item, owner };
  }

  private requireEffect(host: ItemEffectHost, effectId: string): void {
    if (this.deps.documents.findEffect(host, effectId) === null) {
      throw new EffectNotFoundError(effectId);
    }
  }

  private allowsScripts(): boolean {
    return (this.deps.scripts ?? NO_SCRIPTS).allowsScripts();
  }
}
