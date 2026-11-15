import type { FoundryCombatantGroupDocument } from '../foundryCombatantGroupTypes';
import type {
  FoundryCombatSceneToken,
  FoundryCombatWorldGame,
  FoundryEncounterCombatant,
  FoundryEncounterDocument
} from '../foundryEncounterTypes';
import { combatDocument, combatantDocument } from './fakeDocuments';

// Fakes shaped as the probe of the installed Foundry 13 / 14 data models and
// the client documents show them: groups prepared with their members, the
// combatant's `group` replaced by the group document it names.

export function encounterCombatant(overrides: Partial<FoundryEncounterCombatant> = {}): FoundryEncounterCombatant {
  return Object.assign(combatantDocument(overrides), { sceneId: overrides.sceneId ?? null });
}

export interface GroupFields {
  id?: string;
  name?: string | null | undefined;
  img?: string | null;
  initiative?: number | null;
  members?: FoundryEncounterCombatant[];
}

export function groupDocument(fields: GroupFields = {}): FoundryCombatantGroupDocument & {
  update: jest.Mock;
  delete: jest.Mock;
} {
  const members = fields.members ?? [];
  const document = {
    id: fields.id ?? 'gggggggggggggggg',
    name: 'name' in fields ? fields.name : 'Wolves',
    img: fields.img ?? null,
    initiative: fields.initiative ?? null,
    defeated: members.every((member) => member.defeated),
    hidden: members.every((member) => member.hidden),
    members: new Set(members),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined)
  };
  document.update.mockImplementation((data: Record<string, unknown>) => {
    Object.assign(document, data);
    return Promise.resolve(document);
  });
  for (const member of members) {
    member.group = document;
  }
  return document;
}

export interface EncounterFields {
  id?: string;
  name?: string;
  scene?: { id: string } | null;
  active?: boolean;
  round?: number;
  turn?: number;
  started?: boolean;
  groups?: FoundryCombatantGroupDocument[] | undefined;
}

export interface EncounterMocks {
  document: FoundryEncounterDocument;
  update: jest.Mock;
  activate: jest.Mock;
  nextRound: jest.Mock;
  previousRound: jest.Mock;
  resetAll: jest.Mock;
  createEmbedded: jest.Mock;
}

export function encounterDocument(
  fields: EncounterFields = {},
  combatants: FoundryEncounterCombatant[] = []
): EncounterMocks {
  const base = combatDocument(
    {
      id: fields.id ?? 'fight',
      round: fields.round ?? 1,
      turn: fields.turn ?? 0,
      started: fields.started ?? (fields.round ?? 1) > 0
    },
    combatants
  );
  const groups = 'groups' in fields ? fields.groups : [];
  const mocks = {
    nextRound: jest.fn(),
    previousRound: jest.fn(),
    resetAll: jest.fn().mockResolvedValue(undefined)
  };
  const document: FoundryEncounterDocument = Object.assign(base.document, {
    scene: fields.scene ?? null,
    active: fields.active ?? false,
    combatants: {
      get: (id: string) => combatants.find((candidate) => candidate.id === id),
      contents: combatants
    },
    ...(groups !== undefined
      ? {
          groups: {
            get: (id: string) => groups.find((candidate) => candidate.id === id),
            contents: groups
          }
        }
      : {}),
    ...(fields.name !== undefined ? { name: fields.name } : {}),
    nextRound: mocks.nextRound,
    previousRound: mocks.previousRound,
    resetAll: mocks.resetAll,
    createEmbeddedDocuments: base.createEmbedded
  });
  base.activate.mockImplementation(() => {
    document.active = true;
    return Promise.resolve(document);
  });
  mocks.nextRound.mockImplementation(() => {
    document.round += 1;
    return Promise.resolve(document);
  });
  mocks.previousRound.mockImplementation(() => {
    document.round -= 1;
    return Promise.resolve(document);
  });
  return {
    document,
    update: base.update,
    activate: base.activate,
    createEmbedded: base.createEmbedded,
    ...mocks
  };
}

export interface WorldOptions {
  viewed?: FoundryEncounterDocument | null;
  activeScene?: string | null;
  tokens?: Record<string, FoundryCombatSceneToken[]>;
  stored?: unknown;
}

export interface FakeWorld {
  game: FoundryCombatWorldGame;
  set: jest.Mock;
}

export function worldWith(combats: FoundryEncounterDocument[], options: WorldOptions = {}): FakeWorld {
  const tokens = options.tokens ?? {};
  const scenes = Object.keys(tokens).map((sceneId) => ({
    id: sceneId,
    name: sceneId,
    tokens: { get: (id: string) => tokens[sceneId]?.find((token) => token.id === id) }
  }));
  let stored = options.stored;
  const set = jest.fn((_namespace: string, _key: string, value: unknown) => {
    stored = value;
    return Promise.resolve(value);
  });
  return {
    game: {
      combat: 'viewed' in options ? options.viewed : null,
      combats: { get: (id) => combats.find((candidate) => candidate.id === id), contents: combats },
      scenes: {
        active: scenes.find((scene) => scene.id === options.activeScene),
        get: (id) => scenes.find((scene) => scene.id === id)
      },
      settings: { get: () => stored, set }
    },
    set
  };
}
