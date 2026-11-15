import { FoundryActorLocator } from '../FoundryActorLocator';
import type { FoundryActorLike, FoundryActorScene, FoundryActorsGame } from '../foundryActors';

type Scene = FoundryActorScene<FoundryActorLike>;

function scene(id: string, tokens: Record<string, FoundryActorLike | null> = {}): Scene {
  return {
    id,
    tokens: {
      get: (tokenId) => (tokenId in tokens ? { id: tokenId, actor: tokens[tokenId] ?? null } : undefined)
    }
  };
}

interface Setup {
  locator: FoundryActorLocator;
  getScene: jest.Mock;
  getActor: jest.Mock;
}

function setup(options: { active?: Scene | undefined; scenes?: Scene[]; actors?: FoundryActorLike[] } = {}): Setup {
  const scenes = options.scenes ?? [];
  const actors = options.actors ?? [];
  const getScene = jest.fn((id: string) => scenes.find((candidate) => candidate.id === id));
  const getActor = jest.fn((id: string) => actors.find((candidate) => candidate.id === id));
  const game: FoundryActorsGame = {
    actors: { get: getActor },
    scenes: { get: getScene, active: options.active }
  };
  return { locator: new FoundryActorLocator({ getGame: () => game }), getScene, getActor };
}

describe('FoundryActorLocator', () => {
  describe('world actors', () => {
    it('finds a world actor by id', () => {
      const { locator, getActor } = setup({ actors: [{ id: 'a1', name: 'Goblin' }] });

      expect(locator.findWorldActor('a1')).toEqual({ id: 'a1', name: 'Goblin' });
      expect(getActor).toHaveBeenCalledWith('a1');
    });

    it('returns null for an unknown actor', () => {
      expect(setup().locator.findWorldActor('zz')).toBeNull();
    });

    it('does not need scenes to find a world actor', () => {
      const game = { actors: { get: () => ({ id: 'a1', name: 'Goblin' }) } } as unknown as FoundryActorsGame;

      expect(new FoundryActorLocator({ getGame: () => game }).findWorldActor('a1')).toEqual({ id: 'a1', name: 'Goblin' });
    });
  });

  describe('tokens', () => {
    it('finds a token with the actor it stands for', () => {
      const { locator } = setup({ active: scene('s1', { t1: { id: 'a1', name: 'Goblin 3' } }) });

      expect(locator.findToken('s1', 't1')).toEqual({ id: 't1', actor: { id: 'a1', name: 'Goblin 3' } });
    });

    it('reaches a token of the active scene without a collection lookup', () => {
      const { locator, getScene } = setup({ active: scene('s1', { t1: { id: 'a1', name: 'Goblin' } }) });

      expect(locator.findToken('s1', 't1')?.id).toBe('t1');
      expect(getScene).not.toHaveBeenCalled();
    });

    it('looks on the named scene only', () => {
      const tavern = scene('s2', { t9: { id: 'a2', name: 'Barkeep' } });
      const { locator } = setup({ active: scene('s1', { t1: { id: 'a1', name: 'Goblin' } }), scenes: [tavern] });

      expect(locator.findToken('s2', 't9')?.actor?.name).toBe('Barkeep');
      expect(locator.findToken('s2', 't1')).toBeNull();
    });

    it('finds a token of a named scene when no scene is active', () => {
      const { locator } = setup({ active: undefined, scenes: [scene('s2', { t9: { id: 'a2', name: 'Barkeep' } })] });

      expect(locator.findToken('s2', 't9')?.actor).toEqual({ id: 'a2', name: 'Barkeep' });
    });

    it('reports a token that stands for no actor', () => {
      const { locator } = setup({ active: scene('s1', { t1: null }) });

      expect(locator.findToken('s1', 't1')).toEqual({ id: 't1', actor: null });
    });

    it('returns null for an unknown token or scene', () => {
      const { locator } = setup({ active: scene('s1') });

      expect(locator.findToken('s1', 'zz')).toBeNull();
      expect(locator.findToken('missing', 't1')).toBeNull();
    });
  });
});
