import type { SceneIdentity, SceneLocator } from '../../../shared';
import {
  CombatNotFoundError,
  type Combat,
  type CombatIdentity,
  type CombatLocator,
  type CombatToken,
  type CombatTokenReader,
  type CombatTrackerConfig,
  type CombatantGroup,
  type CombatantGroupChanges,
  type CombatantGroupDraft,
  type CombatantGroupStore,
  type Encounter,
  type EncounterStore,
  type TrackerConfigStore
} from '../../domain';
import { combat } from './fakePorts';

export function encounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 'fight',
    sceneId: null,
    active: true,
    isDefault: true,
    started: true,
    round: 2,
    turn: 0,
    combatantCount: 1,
    combatantSceneIds: [],
    ...overrides
  };
}

/** Encounters of a world, and what was done to them. */
export class FakeEncounters implements CombatLocator, EncounterStore {
  readonly journal: string[] = [];
  private readonly encounters = new Map<string, Encounter>();

  constructor(
    encounters: readonly Encounter[] = [encounter()],
    private readonly activeId: string | null = encounters[0]?.id ?? null
  ) {
    for (const entry of encounters) {
      this.encounters.set(entry.id, entry);
    }
  }

  findCombat(combatId: string): CombatIdentity | null {
    return this.encounters.has(combatId) ? { id: combatId } : null;
  }

  findActiveCombat(): CombatIdentity | null {
    return this.activeId !== null ? { id: this.activeId } : null;
  }

  listEncounters(): readonly Encounter[] {
    return [...this.encounters.values()];
  }

  readEncounter(combatId: string): Encounter {
    const found = this.encounters.get(combatId);
    if (found === undefined) {
      throw new CombatNotFoundError(combatId);
    }
    return found;
  }

  activate(combatId: string): Promise<Encounter> {
    this.journal.push(`activate ${combatId}`);
    return Promise.resolve(this.change(combatId, { active: true }));
  }

  linkScene(combatId: string, sceneId: string | null): Promise<Encounter> {
    this.journal.push(`link ${combatId} ${String(sceneId)}`);
    return Promise.resolve(this.change(combatId, { sceneId }));
  }

  nextRound(combatId: string): Promise<Combat> {
    this.journal.push(`next-round ${combatId}`);
    return Promise.resolve(combat({ id: combatId, round: this.readEncounter(combatId).round + 1 }));
  }

  previousRound(combatId: string): Promise<Combat> {
    this.journal.push(`previous-round ${combatId}`);
    return Promise.resolve(combat({ id: combatId, round: this.readEncounter(combatId).round - 1 }));
  }

  resetInitiative(combatId: string): Promise<Combat> {
    this.journal.push(`reset ${combatId}`);
    return Promise.resolve(combat({ id: combatId }));
  }

  private change(combatId: string, change: Partial<Encounter>): Encounter {
    const changed = { ...this.readEncounter(combatId), ...change };
    this.encounters.set(combatId, changed);
    return changed;
  }
}

export function group(overrides: Partial<CombatantGroup> = {}): CombatantGroup {
  return {
    id: 'wolves',
    name: 'Wolves',
    img: null,
    initiative: null,
    defeated: true,
    hidden: true,
    memberIds: [],
    ...overrides
  };
}

/** The groups of each encounter of a world. */
export class FakeGroups implements CombatantGroupStore {
  readonly journal: string[] = [];
  available = true;
  createsNothing = false;
  losesGroupOnUpdate = false;
  private readonly groups = new Map<string, CombatantGroup[]>();

  constructor(groups: Readonly<Record<string, CombatantGroup[]>> = { fight: [group()] }) {
    for (const [combatId, entries] of Object.entries(groups)) {
      this.groups.set(combatId, [...entries]);
    }
  }

  groupsAvailable(): boolean {
    return this.available;
  }

  listGroups(combatId: string): readonly CombatantGroup[] {
    return [...this.of(combatId)];
  }

  findGroup(combatId: string, groupId: string): CombatantGroup | null {
    return this.of(combatId).find((entry) => entry.id === groupId) ?? null;
  }

  createGroup(combatId: string, draft: CombatantGroupDraft): Promise<CombatantGroup | null> {
    this.journal.push(`create ${combatId} ${JSON.stringify(draft)}`);
    if (this.createsNothing) {
      return Promise.resolve(null);
    }
    const created = group({ id: 'created', name: draft.name ?? null, img: draft.img ?? null, initiative: draft.initiative ?? null });
    this.of(combatId).push(created);
    return Promise.resolve(created);
  }

  updateGroup(combatId: string, groupId: string, changes: CombatantGroupChanges): Promise<CombatantGroup | null> {
    this.journal.push(`update ${combatId} ${groupId} ${JSON.stringify(changes)}`);
    const current = this.findGroup(combatId, groupId);
    if (current === null || this.losesGroupOnUpdate) {
      return Promise.resolve(null);
    }
    const updated: CombatantGroup = {
      ...current,
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.img !== undefined ? { img: changes.img } : {}),
      ...(changes.initiative !== undefined ? { initiative: changes.initiative } : {})
    };
    return Promise.resolve(updated);
  }

  deleteGroup(combatId: string, groupId: string): Promise<void> {
    this.journal.push(`delete ${combatId} ${groupId}`);
    return Promise.resolve();
  }

  private of(combatId: string): CombatantGroup[] {
    let entries = this.groups.get(combatId);
    if (entries === undefined) {
      entries = [];
      this.groups.set(combatId, entries);
    }
    return entries;
  }
}

/** Scenes by id, one of which may be active. */
export class FakeScenes implements SceneLocator {
  constructor(
    private readonly sceneIds: readonly string[] = ['crypt', 'tavern'],
    private readonly activeId: string | null = 'tavern'
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return this.sceneIds.includes(sceneId) ? { id: sceneId, name: sceneId } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId !== null ? { id: this.activeId, name: this.activeId } : null;
  }
}

/** Tokens on scenes, and the scene each encounter is linked to. */
export class FakeTokens implements CombatTokenReader {
  readonly looked: string[] = [];

  constructor(
    private readonly tokens: readonly CombatToken[],
    private readonly linked: Readonly<Record<string, string>> = {}
  ) {}

  linkedSceneId(combatId: string): string | null {
    return this.linked[combatId] ?? null;
  }

  findToken(sceneId: string, tokenId: string): CombatToken | null {
    this.looked.push(`${sceneId}/${tokenId}`);
    return this.tokens.find((token) => token.sceneId === sceneId && token.id === tokenId) ?? null;
  }
}

export class FakeTrackerConfig implements TrackerConfigStore {
  readonly written: CombatTrackerConfig[] = [];
  markers = true;
  animations: readonly string[] = ['spin', 'spinPulse', 'pulse'];

  constructor(
    public config: CombatTrackerConfig = {
      resource: null,
      skipDefeated: false,
      turnMarker: { enabled: true, animation: 'spin', src: null, disposition: false }
    }
  ) {}

  turnMarkersAvailable(): boolean {
    return this.markers;
  }

  readConfig(): CombatTrackerConfig {
    return this.config;
  }

  writeConfig(config: CombatTrackerConfig): Promise<void> {
    this.written.push(config);
    this.config = config;
    return Promise.resolve();
  }

  turnMarkerAnimations(): readonly string[] {
    return this.animations;
  }
}
