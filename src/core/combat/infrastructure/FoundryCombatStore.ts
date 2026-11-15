import type {
  ActiveSceneReader,
  Combat,
  CombatDraft,
  CombatIdentity,
  CombatLocator,
  CombatStore,
  TurnOverview,
  TurnReader
} from '@/core/combat/domain';
import { findCombatDocument, requireCombatDocument, type CombatGameProvider } from './combatDocuments';
import { toCombat, toFoundryCombatData, toTurnOverview } from './combatMapper';
import type { FoundryCombatClass, FoundryCombatDocument } from './foundryCombatTypes';

/** Reads the `Combat` document class on every call: it does not exist before Foundry is ready. */
export type CombatClassProvider = () => FoundryCombatClass;

const combatClassFromGlobalThis: CombatClassProvider = () =>
  (globalThis as unknown as { Combat: FoundryCombatClass }).Combat;

function toIdentity(document: FoundryCombatDocument): CombatIdentity {
  return { id: document.id };
}

/** Anti-corruption layer over the world's Combat documents. */
export class FoundryCombatStore implements CombatLocator, CombatStore, TurnReader, ActiveSceneReader {
  constructor(
    private readonly gameProvider: CombatGameProvider,
    private readonly combatClass: CombatClassProvider = combatClassFromGlobalThis
  ) {}

  findCombat(combatId: string): CombatIdentity | null {
    const document = findCombatDocument(this.gameProvider.getGame(), combatId);
    return document !== undefined ? toIdentity(document) : null;
  }

  /** What the wire calls the active combat is `game.combat`: the encounter the combat tracker shows. */
  findActiveCombat(): CombatIdentity | null {
    const document = this.gameProvider.getGame().combat;
    return document ? toIdentity(document) : null;
  }

  findActiveSceneId(): string | null {
    return this.gameProvider.getGame().scenes.active?.id ?? null;
  }

  readCombat(combatId: string): Combat {
    return toCombat(this.require(combatId));
  }

  readTurn(combatId: string): TurnOverview {
    return toTurnOverview(this.require(combatId));
  }

  /** The scene is linked by `create`; activation is a second call, on the document `create` resolves to. */
  async createCombat(draft: CombatDraft): Promise<Combat | null> {
    const created = await this.combatClass().create(toFoundryCombatData(draft));
    if (!created) {
      return null;
    }
    if (draft.activate) {
      await created.activate();
    }
    return toCombat(created);
  }

  // The three turn commands report the document their call resolves to, and
  // the combat as it stands when the call resolves to nothing.

  async startCombat(combatId: string): Promise<Combat> {
    const document = this.require(combatId);
    return toCombat((await document.startCombat()) ?? document);
  }

  async nextTurn(combatId: string): Promise<Combat> {
    const document = this.require(combatId);
    return toCombat((await document.nextTurn()) ?? document);
  }

  async previousTurn(combatId: string): Promise<Combat> {
    const document = this.require(combatId);
    return toCombat((await document.previousTurn()) ?? document);
  }

  async setTurn(combatId: string, turn: number): Promise<Combat> {
    const document = this.require(combatId);
    await document.update({ turn });
    return toCombat(document);
  }

  async deleteCombat(combatId: string): Promise<void> {
    await this.require(combatId).delete();
  }

  private require(combatId: string): FoundryCombatDocument {
    return requireCombatDocument(this.gameProvider, combatId);
  }
}
