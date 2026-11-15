import {
  CombatNotFoundError,
  type ActiveSceneReader,
  type Battlefield,
  type BattlefieldReader,
  type CanvasCollisions,
  type Combat,
  type CombatDraft,
  type CombatIdentity,
  type CombatLocator,
  type CombatStore,
  type Combatant,
  type CombatantChanges,
  type CombatantDraft,
  type CombatantStore,
  type InitiativeRollOptions,
  type InitiativeStore,
  type MapCollisionTest,
  type SightTest,
  type TurnOverview,
  type TurnReader
} from '../../domain';
import { combat, combatant } from '../../domain/__tests__/fixtures';

export { battlefieldToken, combat, combatant } from '../../domain/__tests__/fixtures';

/** A world of encounters, each with the combatants it was given. */
export class FakeCombats
  implements CombatLocator, CombatStore, TurnReader, CombatantStore, InitiativeStore, ActiveSceneReader
{
  readonly journal: string[] = [];
  readonly drafts: CombatDraft[] = [];
  readonly combatantDrafts: CombatantDraft[] = [];
  activeSceneId: string | null = 'dungeon';
  createsNothing = false;
  addsNothing = false;
  losesCombatantOnUpdate = false;
  losesCombatantOnInitiative = false;
  /** What a roll gives every combatant that is rolled for. */
  rollResult = 17;
  /** The scene the token of the current combatant is on, as far as the encounter knows. */
  currentSceneId: string | null = null;

  private readonly combats = new Map<string, Combat>();
  private readonly rosters = new Map<string, Combatant[]>();

  constructor(
    combats: readonly Combat[] = [combat()],
    private activeId: string | null = combats[0]?.id ?? null
  ) {
    for (const entry of combats) {
      this.combats.set(entry.id, entry);
      this.rosters.set(entry.id, [...entry.turnOrder]);
    }
  }

  /** Combatants of an encounter that are not (or not yet) part of its turn order. */
  enlist(combatId: string, ...combatants: Combatant[]): void {
    this.roster(combatId).push(...combatants);
  }

  findCombat(combatId: string): CombatIdentity | null {
    return this.combats.has(combatId) ? { id: combatId } : null;
  }

  findActiveCombat(): CombatIdentity | null {
    return this.activeId !== null ? { id: this.activeId } : null;
  }

  findActiveSceneId(): string | null {
    return this.activeSceneId;
  }

  readCombat(combatId: string): Combat {
    const found = this.combats.get(combatId);
    if (found === undefined) {
      throw new CombatNotFoundError(combatId);
    }
    return found;
  }

  readTurn(combatId: string): TurnOverview {
    const found = this.readCombat(combatId);
    return {
      round: found.round,
      turn: found.turn,
      current: found.current,
      currentSceneId: this.currentSceneId,
      combatants: this.roster(combatId)
    };
  }

  createCombat(draft: CombatDraft): Promise<Combat | null> {
    this.drafts.push(draft);
    return Promise.resolve(
      this.createsNothing ? null : combat({ id: 'created', round: 0, started: false, turnOrder: [], current: null })
    );
  }

  startCombat(combatId: string): Promise<Combat> {
    this.journal.push(`start ${combatId}`);
    return Promise.resolve({ ...this.readCombat(combatId), started: true, round: 1, turn: 0 });
  }

  nextTurn(combatId: string): Promise<Combat> {
    this.journal.push(`next ${combatId}`);
    const current = this.readCombat(combatId);
    return Promise.resolve({ ...current, turn: current.turn + 1 });
  }

  previousTurn(combatId: string): Promise<Combat> {
    this.journal.push(`previous ${combatId}`);
    const current = this.readCombat(combatId);
    return Promise.resolve({ ...current, turn: current.turn - 1 });
  }

  setTurn(combatId: string, turn: number): Promise<Combat> {
    this.journal.push(`turn ${combatId} ${String(turn)}`);
    return Promise.resolve({ ...this.readCombat(combatId), turn });
  }

  deleteCombat(combatId: string): Promise<void> {
    this.journal.push(`delete ${combatId}`);
    this.readCombat(combatId);
    return Promise.resolve();
  }

  listCombatants(combatId: string): readonly Combatant[] {
    return [...this.roster(combatId)];
  }

  findCombatant(combatId: string, combatantId: string): Combatant | null {
    return this.roster(combatId).find((candidate) => candidate.id === combatantId) ?? null;
  }

  addCombatant(combatId: string, draft: CombatantDraft): Promise<Combatant | null> {
    this.journal.push(`add ${combatId}`);
    this.combatantDrafts.push(draft);
    if (this.addsNothing) {
      return Promise.resolve(null);
    }
    const added = combatant({ id: 'added', actorId: draft.actorId, tokenId: draft.tokenId ?? null });
    this.roster(combatId).push(added);
    return Promise.resolve(added);
  }

  updateCombatant(combatId: string, combatantId: string, changes: CombatantChanges): Promise<Combatant | null> {
    this.journal.push(`update ${combatId} ${combatantId} ${JSON.stringify(changes)}`);
    if (this.losesCombatantOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve(
      this.replace(combatId, combatantId, (current) => ({
        ...current,
        ...(changes.initiative !== undefined ? { initiative: changes.initiative } : {}),
        ...(changes.defeated !== undefined ? { defeated: changes.defeated } : {}),
        ...(changes.hidden !== undefined ? { hidden: changes.hidden } : {})
      }))
    );
  }

  removeCombatant(combatId: string, combatantId: string): Promise<void> {
    this.journal.push(`remove ${combatId} ${combatantId}`);
    this.rosters.set(
      combatId,
      this.roster(combatId).filter((candidate) => candidate.id !== combatantId)
    );
    return Promise.resolve();
  }

  setInitiative(combatId: string, combatantId: string, initiative: number | null): Promise<void> {
    this.journal.push(`initiative ${combatId} ${combatantId} ${String(initiative)}`);
    if (this.losesCombatantOnInitiative) {
      return this.removeCombatant(combatId, combatantId);
    }
    this.replace(combatId, combatantId, (current) => ({ ...current, initiative }));
    return Promise.resolve();
  }

  rollInitiative(combatId: string, combatantIds: readonly string[], options: InitiativeRollOptions): Promise<void> {
    this.journal.push(`roll ${combatId} ${combatantIds.join(',')} ${JSON.stringify(options)}`);
    for (const combatantId of combatantIds) {
      this.replace(combatId, combatantId, (current) => ({ ...current, initiative: this.rollResult }));
    }
    return Promise.resolve();
  }

  rollAll(combatId: string, options: InitiativeRollOptions): Promise<void> {
    this.journal.push(`roll-all ${combatId} ${JSON.stringify(options)}`);
    this.rollMissing(combatId, () => true);
    return Promise.resolve();
  }

  /** In this world a combatant whose name starts with "NPC" is one no player controls. */
  rollNpcs(combatId: string, options: InitiativeRollOptions): Promise<void> {
    this.journal.push(`roll-npcs ${combatId} ${JSON.stringify(options)}`);
    this.rollMissing(combatId, (candidate) => candidate.name.startsWith('NPC'));
    return Promise.resolve();
  }

  private rollMissing(combatId: string, eligible: (candidate: Combatant) => boolean): void {
    for (const candidate of this.listCombatants(combatId)) {
      if (candidate.initiative === null && eligible(candidate)) {
        this.replace(combatId, candidate.id, (current) => ({ ...current, initiative: this.rollResult }));
      }
    }
  }

  private roster(combatId: string): Combatant[] {
    const roster = this.rosters.get(combatId);
    if (roster === undefined) {
      throw new CombatNotFoundError(combatId);
    }
    return roster;
  }

  private replace(combatId: string, combatantId: string, change: (current: Combatant) => Combatant): Combatant | null {
    const roster = this.roster(combatId);
    const index = roster.findIndex((candidate) => candidate.id === combatantId);
    const current = roster[index];
    if (current === undefined) {
      return null;
    }
    const changed = change(current);
    roster[index] = changed;
    return changed;
  }
}

/** The scenes of a world by id, one of which this client may be viewing. */
export class FakeBattlefields implements BattlefieldReader {
  readonly read: string[] = [];

  constructor(
    private readonly scenes: Readonly<Record<string, Battlefield>>,
    private readonly viewedId: string | null
  ) {}

  readScene(sceneId: string): Battlefield | null {
    this.read.push(sceneId);
    const scene = this.scenes[sceneId];
    return scene !== undefined ? { ...scene, onCanvas: sceneId === this.viewedId } : null;
  }

  readViewedScene(): Battlefield | null {
    this.read.push('viewed');
    const scene = this.viewedId !== null ? this.scenes[this.viewedId] : undefined;
    return scene !== undefined ? { ...scene, onCanvas: true } : null;
  }
}

export class FakeCollisions implements CanvasCollisions {
  asked = 0;

  constructor(
    private readonly sight: SightTest | undefined,
    private readonly movement: MapCollisionTest | undefined
  ) {}

  sightTest(): SightTest | undefined {
    this.asked += 1;
    return this.sight;
  }

  movementTest(): MapCollisionTest | undefined {
    this.asked += 1;
    return this.movement;
  }
}

export const NOTHING_BLOCKS: MapCollisionTest = { testCollision: () => false };

export function battlefield(overrides: Partial<Battlefield> = {}): Battlefield {
  return {
    sceneName: 'Dungeon',
    onCanvas: true,
    grid: { size: 100, distance: 5, units: 'ft' },
    tokens: [],
    walls: [],
    ...overrides
  };
}
