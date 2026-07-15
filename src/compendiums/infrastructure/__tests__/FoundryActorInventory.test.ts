import { FoundryActorInventory } from '../FoundryActorInventory';
import { makeGame, providerFor } from './fixtures';
import type { FoundryWorldActor } from '../foundryPackTypes';

function makeActor(overrides: Partial<FoundryWorldActor> = {}): FoundryWorldActor {
  return {
    id: 'a1',
    name: 'Hero',
    createEmbeddedDocuments: jest.fn(async () => [
      { id: 'i1', name: 'Sword', type: 'weapon', img: 's.png' }
    ]),
    ...overrides
  };
}

describe('FoundryActorInventory', () => {
  it('finds an actor ref by id', () => {
    const game = makeGame();
    game.actors.get = jest.fn(() => makeActor());
    const inventory = new FoundryActorInventory(providerFor(game));

    expect(inventory.findActor('a1')).toEqual({ id: 'a1', name: 'Hero' });
  });

  it('returns null for unknown actor', () => {
    const inventory = new FoundryActorInventory(providerFor(makeGame()));
    expect(inventory.findActor('ghost')).toBeNull();
  });

  it('creates an embedded item and maps the first result', async () => {
    const actor = makeActor();
    const game = makeGame();
    game.actors.get = jest.fn(() => actor);
    const inventory = new FoundryActorInventory(providerFor(game));

    const created = await inventory.createEmbeddedItem('a1', { name: 'Sword' });
    expect(actor.createEmbeddedDocuments).toHaveBeenCalledWith('Item', [{ name: 'Sword' }]);
    expect(created).toEqual({ id: 'i1', name: 'Sword', type: 'weapon', img: 's.png' });
  });

  it('returns null when actor vanished or create yields nothing', async () => {
    const emptyActor = makeActor({
      createEmbeddedDocuments: jest.fn(async () => [])
    });
    const game = makeGame();
    game.actors.get = jest.fn(() => emptyActor);
    const inventory = new FoundryActorInventory(providerFor(game));

    expect(await inventory.createEmbeddedItem('a1', {})).toBeNull();

    const noActorInventory = new FoundryActorInventory(providerFor(makeGame()));
    expect(await noActorInventory.createEmbeddedItem('ghost', {})).toBeNull();
  });
});
