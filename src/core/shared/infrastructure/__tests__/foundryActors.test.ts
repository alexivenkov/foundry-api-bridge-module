import {
  ActorNotFoundError,
  SceneNotFoundError,
  TargetTokenNotFoundError,
  TokenHasNoActorError
} from '../../domain';
import { requireFoundryActor, type FoundryActorScene, type FoundryActorsGame } from '../foundryActors';

interface Actor {
  id: string;
  name: string;
  hp: number;
}

const worldGoblin: Actor = { id: 'a1', name: 'Goblin', hp: 7 };
const goblinThree: Actor = { id: 'a1', name: 'Goblin 3', hp: 2 };

function game(): FoundryActorsGame<Actor> {
  const cave: FoundryActorScene<Actor> = {
    id: 's1',
    tokens: {
      get: (id) => (id === 't3' ? { id: 't3', actor: goblinThree } : id === 'empty' ? { id: 'empty', actor: null } : undefined)
    }
  };
  return {
    actors: { get: (id) => (id === 'a1' ? worldGoblin : undefined) },
    scenes: { get: (id) => (id === 's1' ? cave : undefined), active: null }
  };
}

describe('requireFoundryActor', () => {
  it('returns the world actor of a world reference', () => {
    expect(requireFoundryActor(game(), { kind: 'world', actorId: 'a1' })).toBe(worldGoblin);
  });

  it("returns the token's own actor of a token reference, not the world actor it shares an id with", () => {
    expect(requireFoundryActor(game(), { kind: 'token', sceneId: 's1', tokenId: 't3' })).toBe(goblinThree);
  });

  it('fails the way resolving the reference would when the actor is gone', () => {
    expect(() => requireFoundryActor(game(), { kind: 'world', actorId: 'zz' })).toThrow(ActorNotFoundError);
    expect(() => requireFoundryActor(game(), { kind: 'world', actorId: 'zz' })).toThrow('Actor not found: zz');

    expect(() => requireFoundryActor(game(), { kind: 'token', sceneId: 'gone', tokenId: 't3' })).toThrow(SceneNotFoundError);
    expect(() => requireFoundryActor(game(), { kind: 'token', sceneId: 's1', tokenId: 'zz' })).toThrow(TargetTokenNotFoundError);
    expect(() => requireFoundryActor(game(), { kind: 'token', sceneId: 's1', tokenId: 'zz' })).toThrow('Token not found: zz');
    expect(() => requireFoundryActor(game(), { kind: 'token', sceneId: 's1', tokenId: 'empty' })).toThrow(TokenHasNoActorError);
    expect(() => requireFoundryActor(game(), { kind: 'token', sceneId: 's1', tokenId: 'empty' })).toThrow('Token has no actor: empty');
  });
});
