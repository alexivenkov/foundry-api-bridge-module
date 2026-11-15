import type {
  ActorIdentity,
  ActorLocator,
  ActorRef,
  SceneIdentity,
  SceneLocator,
  TargetToken
} from '../../../shared';
import {
  EffectItemNotFoundError,
  type ActorEffects,
  type Effect,
  type EffectChanges,
  type EffectDetails,
  type EffectDetailsChanges,
  type EffectDetailsDraft,
  type EffectDocumentStore,
  type EffectDraft,
  type EffectEnvironment,
  type EffectFeatures,
  type EffectHost,
  type EffectIdentity,
  type EffectItemIdentity,
  type EffectStore,
  type ItemEffectHost,
  type StatusToggle,
  type StatusToggleOptions
} from '../../domain';

export function effect(overrides: Partial<Effect> = {}): Effect {
  return {
    id: 'e1',
    name: 'Bless',
    img: 'bless.webp',
    disabled: false,
    statuses: [],
    origin: null,
    changes: [],
    duration: null,
    ...overrides
  };
}

/** A world with one scene, `cave`, holding the tokens given; it is the active scene unless told otherwise. */
export class FakeWorld implements SceneLocator, ActorLocator {
  activeSceneId: string | null = 'cave';

  constructor(
    private readonly worldActors: readonly ActorIdentity[],
    private readonly caveTokens: Readonly<Record<string, ActorIdentity | null>> = {}
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return sceneId === 'cave' ? { id: 'cave', name: 'Cave' } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeSceneId !== null ? this.findScene(this.activeSceneId) : null;
  }

  findWorldActor(actorId: string): ActorIdentity | null {
    return this.worldActors.find((candidate) => candidate.id === actorId) ?? null;
  }

  findToken(sceneId: string, tokenId: string): TargetToken | null {
    if (sceneId !== 'cave' || !(tokenId in this.caveTokens)) {
      return null;
    }
    return { id: tokenId, actor: this.caveTokens[tokenId] ?? null };
  }
}

function keyOf(ref: ActorRef): string {
  return ref.kind === 'world' ? `world:${ref.actorId}` : `token:${ref.sceneId}:${ref.tokenId}`;
}

/** Effects are kept per actor reference: `world:<actorId>` or `token:<sceneId>:<tokenId>`. */
export class FakeEffectStore implements EffectStore {
  readonly toggled: Array<{ ref: ActorRef; statusId: string; options: StatusToggleOptions }> = [];
  readonly created: Array<{ ref: ActorRef; draft: EffectDraft }> = [];
  readonly updated: Array<{ ref: ActorRef; effectId: string; changes: EffectChanges }> = [];
  readonly deleted: Array<{ ref: ActorRef; effectId: string }> = [];
  toggleOutcome: StatusToggle = { active: true, effectId: null };
  createsNothing = false;
  losesEffectOnUpdate = false;

  constructor(
    private readonly effects: Readonly<Record<string, readonly Effect[]>> = {},
    private readonly statuses: Readonly<Record<string, readonly string[]>> = {}
  ) {}

  readEffects(actor: ActorRef): ActorEffects {
    return { effects: this.effects[keyOf(actor)] ?? [], activeStatuses: this.statuses[keyOf(actor)] ?? [] };
  }

  hasEffect(actor: ActorRef, effectId: string): boolean {
    return this.readEffects(actor).effects.some((candidate) => candidate.id === effectId);
  }

  toggleStatus(actor: ActorRef, statusId: string, options: StatusToggleOptions): Promise<StatusToggle> {
    this.toggled.push({ ref: actor, statusId, options });
    return Promise.resolve(this.toggleOutcome);
  }

  createEffect(actor: ActorRef, draft: EffectDraft): Promise<EffectIdentity | null> {
    this.created.push({ ref: actor, draft });
    return Promise.resolve(this.createsNothing ? null : { id: 'created', name: draft.name });
  }

  updateEffect(actor: ActorRef, effectId: string, changes: EffectChanges): Promise<EffectIdentity | null> {
    this.updated.push({ ref: actor, effectId, changes });
    const current = this.readEffects(actor).effects.find((candidate) => candidate.id === effectId);
    if (current === undefined || this.losesEffectOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ id: current.id, name: changes.name ?? current.name });
  }

  deleteEffect(actor: ActorRef, effectId: string): Promise<void> {
    this.deleted.push({ ref: actor, effectId });
    return Promise.resolve();
  }
}

export const FOUNDRY_14_FEATURES: EffectFeatures = {
  subtypes: true,
  durationUnits: true,
  changePhases: true,
  iconVisibility: true
};

export const FOUNDRY_13_FEATURES: EffectFeatures = {
  subtypes: true,
  durationUnits: false,
  changePhases: false,
  iconVisibility: false
};

/** A Foundry 14 world with the core registries and a dnd5e-like `enchantment` subtype, unless told otherwise. */
export class FakeEffectEnvironment implements EffectEnvironment {
  effectTypeIds: readonly string[] | null = ['base', 'enchantment'];
  changeTypeIds: readonly string[] | null = ['custom', 'multiply', 'add', 'subtract', 'downgrade', 'upgrade', 'override'];
  phaseIds: readonly string[] | null = ['initial', 'final'];
  expiryEventIds: readonly string[] | null = ['combatStart', 'roundStart', 'turnStart', 'combatEnd', 'roundEnd', 'turnEnd'];
  refusedOrigins: Readonly<Record<string, string>> = {};

  constructor(private readonly featureSet: EffectFeatures = FOUNDRY_14_FEATURES) {}

  features(): EffectFeatures {
    return this.featureSet;
  }

  effectTypes(): readonly string[] | null {
    return this.effectTypeIds;
  }

  changeTypes(): readonly string[] | null {
    return this.changeTypeIds;
  }

  changePhases(): readonly string[] | null {
    return this.phaseIds;
  }

  expiryEvents(): readonly string[] | null {
    return this.expiryEventIds;
  }

  originProblem(origin: string): string | null {
    return this.refusedOrigins[origin] ?? null;
  }
}

export function effectDetails(overrides: Partial<EffectDetails> = {}): EffectDetails {
  return {
    id: 'e1',
    name: 'Bless',
    img: 'bless.webp',
    type: 'base',
    disabled: false,
    transfer: true,
    description: '',
    tint: '#ffffff',
    origin: null,
    statuses: [],
    sort: 0,
    changes: [],
    duration: null,
    system: {},
    ...overrides
  };
}

function hostKey(host: EffectHost): string {
  if (host.kind === 'actor') {
    return `actor:${keyOf(host.actor)}`;
  }
  return host.actor === null ? `item:${host.itemId}` : `item:${keyOf(host.actor)}:${host.itemId}`;
}

/**
 * Effects kept per host: `actor:<ref>`, `item:<itemId>` (world item) or
 * `item:<ref>:<itemId>` (owned item), with `<ref>` as in `FakeEffectStore`.
 * Items exist when they are named in `items`.
 */
export class FakeEffectDocumentStore implements EffectDocumentStore {
  readonly created: Array<{ host: EffectHost; draft: EffectDetailsDraft }> = [];
  readonly updated: Array<{ host: EffectHost; effectId: string; changes: EffectDetailsChanges }> = [];
  readonly deleted: Array<{ host: EffectHost; effectId: string }> = [];
  createsNothing = false;
  losesEffectOnUpdate = false;

  constructor(
    private readonly items: Readonly<Record<string, EffectItemIdentity>> = {},
    private readonly effects: Record<string, readonly EffectDetails[]> = {}
  ) {}

  findItem(host: ItemEffectHost): EffectItemIdentity | null {
    return this.items[hostKey(host)] ?? null;
  }

  listEffects(host: EffectHost): readonly EffectDetails[] {
    if (host.kind === 'item' && this.findItem(host) === null) {
      throw new EffectItemNotFoundError(host.itemId);
    }
    return this.effects[hostKey(host)] ?? [];
  }

  findEffect(host: EffectHost, effectId: string): EffectDetails | null {
    return this.listEffects(host).find((candidate) => candidate.id === effectId) ?? null;
  }

  createEffect(host: EffectHost, draft: EffectDetailsDraft): Promise<EffectDetails | null> {
    this.created.push({ host, draft });
    return Promise.resolve(this.createsNothing ? null : effectDetails({ id: 'created', name: draft.name }));
  }

  updateEffect(host: EffectHost, effectId: string, changes: EffectDetailsChanges): Promise<EffectDetails | null> {
    this.updated.push({ host, effectId, changes });
    const current = this.findEffect(host, effectId);
    if (current === null || this.losesEffectOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, name: changes.name ?? current.name });
  }

  deleteEffect(host: EffectHost, effectId: string): Promise<void> {
    this.deleted.push({ host, effectId });
    return Promise.resolve();
  }
}
