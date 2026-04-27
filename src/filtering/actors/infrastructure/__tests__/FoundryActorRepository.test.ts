import { ActorType } from '@/filtering/actors/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';

import { FoundryActorMapper } from '../FoundryActorMapper';
import { FoundryActorRepository } from '../FoundryActorRepository';
import type { FoundryActor, FoundryGameGlobals } from '../foundryActorTypes';
import type { FoundryGameProvider } from '../foundryGameProvider';

function snapshotStub(id: string): ActorSnapshot {
  return {
    id,
    name: `Actor ${id}`,
    type: ActorType.Npc,
    hasPlayerOwner: false,
    folderId: null,
    creatureType: null,
    size: null,
    disposition: null,
    cr: null,
    level: null,
    hp: null,
    ac: null,
    abilities: null
  };
}

function rawStub(id: string): FoundryActor {
  return {
    id,
    name: `Actor ${id}`,
    type: 'npc',
    hasPlayerOwner: false,
    folder: null,
    system: {}
  };
}

function makeProvider(actors: readonly FoundryActor[]): {
  provider: FoundryGameProvider;
  spy: jest.Mock;
} {
  const game: FoundryGameGlobals = {
    actors: { contents: actors },
    folders: { get: jest.fn(), contents: [] }
  };
  const spy = jest.fn(() => game);
  return { provider: { getGame: spy }, spy };
}

describe('FoundryActorRepository', () => {
  it('returns an empty array when there are no actors', async () => {
    const { provider } = makeProvider([]);
    const mapper = new FoundryActorMapper();
    const repo = new FoundryActorRepository(provider, mapper);

    const result = await repo.findAll();

    expect(result).toEqual([]);
  });

  it('returns one snapshot per actor in collection order', async () => {
    const raws = [rawStub('a1'), rawStub('a2'), rawStub('a3')];
    const { provider } = makeProvider(raws);
    const mapper = new FoundryActorMapper();
    const repo = new FoundryActorRepository(provider, mapper);

    const result = await repo.findAll();

    expect(result.map((s) => s.id)).toEqual(['a1', 'a2', 'a3']);
  });

  it('delegates each actor to mapper.toSnapshot', async () => {
    const raws = [rawStub('a1'), rawStub('a2')];
    const { provider } = makeProvider(raws);
    const mapper = new FoundryActorMapper();
    const toSnapshotSpy = jest
      .spyOn(mapper, 'toSnapshot')
      .mockImplementation((raw: FoundryActor) => snapshotStub(raw.id));
    const repo = new FoundryActorRepository(provider, mapper);

    const result = await repo.findAll();

    expect(toSnapshotSpy).toHaveBeenCalledTimes(2);
    expect(toSnapshotSpy).toHaveBeenNthCalledWith(1, raws[0]);
    expect(toSnapshotSpy).toHaveBeenNthCalledWith(2, raws[1]);
    expect(result).toEqual([snapshotStub('a1'), snapshotStub('a2')]);
  });

  it('calls gameProvider.getGame exactly once per findAll', async () => {
    const { provider, spy } = makeProvider([rawStub('a1')]);
    const repo = new FoundryActorRepository(provider, new FoundryActorMapper());

    await repo.findAll();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('returns a Promise (matches FilterableRepository contract)', () => {
    const { provider } = makeProvider([]);
    const repo = new FoundryActorRepository(provider, new FoundryActorMapper());

    const result = repo.findAll();

    expect(result).toBeInstanceOf(Promise);
  });
});
