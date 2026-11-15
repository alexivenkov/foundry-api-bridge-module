import type { FoundryBattlefieldScene } from '../foundryBattlefieldTypes';
import type {
  FoundryCombatDocument,
  FoundryCombatGame,
  FoundryCombatantDocument
} from '../foundryCombatTypes';

/** A combatant document that, like the core's, is updated in place. */
export function combatantDocument(overrides: Partial<FoundryCombatantDocument> = {}): FoundryCombatantDocument {
  const document: FoundryCombatantDocument = {
    id: 'c1',
    actorId: 'a1',
    tokenId: 't1',
    name: 'Fighter',
    img: 'icons/fighter.webp',
    initiative: 15,
    defeated: false,
    hidden: false,
    token: null,
    update: jest.fn(),
    ...overrides
  };
  if (overrides.update === undefined) {
    (document.update as jest.Mock).mockImplementation((data: Partial<FoundryCombatantDocument>) => {
      Object.assign(document, data);
      return Promise.resolve(document);
    });
  }
  return document;
}

export interface CombatMocks {
  document: FoundryCombatDocument;
  startCombat: jest.Mock;
  nextTurn: jest.Mock;
  previousTurn: jest.Mock;
  remove: jest.Mock;
  activate: jest.Mock;
  update: jest.Mock;
  createEmbedded: jest.Mock;
  deleteEmbedded: jest.Mock;
  rollInitiative: jest.Mock;
  rollAll: jest.Mock;
  rollNPC: jest.Mock;
  setInitiative: jest.Mock;
}

export type CombatFields = Partial<Pick<FoundryCombatDocument, 'id' | 'round' | 'turn' | 'started' | 'combatant' | 'turns'>>;

/** A combat whose turn order is its combatants, in the order given, unless `turns` says otherwise. */
export function combatDocument(fields: CombatFields = {}, combatants: FoundryCombatantDocument[] = []): CombatMocks {
  const mocks = {
    startCombat: jest.fn(),
    nextTurn: jest.fn(),
    previousTurn: jest.fn(),
    remove: jest.fn().mockResolvedValue(undefined),
    activate: jest.fn().mockResolvedValue(undefined),
    update: jest.fn(),
    createEmbedded: jest.fn(),
    deleteEmbedded: jest.fn().mockResolvedValue([]),
    rollInitiative: jest.fn(),
    rollAll: jest.fn(),
    rollNPC: jest.fn(),
    setInitiative: jest.fn().mockResolvedValue(undefined)
  };
  const document: FoundryCombatDocument = {
    id: 'fight',
    round: 0,
    turn: 0,
    started: false,
    combatant: null,
    combatants: { get: (id) => combatants.find((candidate) => candidate.id === id), contents: combatants },
    turns: combatants,
    startCombat: mocks.startCombat,
    nextTurn: mocks.nextTurn,
    previousTurn: mocks.previousTurn,
    delete: mocks.remove,
    activate: mocks.activate,
    update: mocks.update,
    createEmbeddedDocuments: mocks.createEmbedded,
    deleteEmbeddedDocuments: mocks.deleteEmbedded,
    rollInitiative: mocks.rollInitiative,
    rollAll: mocks.rollAll,
    rollNPC: mocks.rollNPC,
    setInitiative: mocks.setInitiative,
    ...fields
  };
  mocks.update.mockImplementation((data: Partial<FoundryCombatDocument>) => {
    Object.assign(document, data);
    return Promise.resolve(document);
  });
  for (const call of [mocks.startCombat, mocks.nextTurn, mocks.previousTurn, mocks.rollInitiative, mocks.rollAll, mocks.rollNPC]) {
    call.mockResolvedValue(document);
  }
  return { document, ...mocks };
}

export interface GameOptions {
  /** The combat the tracker shows; by default none. */
  viewed?: FoundryCombatDocument | null | undefined;
  activeScene?: { id: string } | null | undefined;
  scenes?: FoundryBattlefieldScene[];
}

/** `Combatant#token` as the core resolves it: the token document, whose parent is the scene it is on. */
export function tokenOn(sceneId: string): NonNullable<FoundryCombatantDocument['token']> {
  return { parent: { id: sceneId } };
}

export function setFoundryGeneration(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

export function clearFoundryGeneration(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

export function gameWith(combats: FoundryCombatDocument[], options: GameOptions = {}): {
  game: FoundryCombatGame;
  get: jest.Mock;
} {
  const get = jest.fn((id: string) => combats.find((candidate) => candidate.id === id));
  return {
    game: {
      combat: 'viewed' in options ? options.viewed : null,
      combats: { get },
      scenes: {
        active: 'activeScene' in options ? options.activeScene : { id: 'dungeon' },
        get: (id) => (options.scenes ?? []).find((candidate) => candidate.id === id)
      }
    },
    get
  };
}
