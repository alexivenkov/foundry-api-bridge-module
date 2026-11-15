import { NoActiveSceneError, SceneNotFoundError, type SceneIdentity, type SceneLocator } from '../../domain';
import { requireScene } from '../requireScene';

function locator(scenes: readonly SceneIdentity[], active: SceneIdentity | null): SceneLocator {
  return {
    findScene: (sceneId) => scenes.find((scene) => scene.id === sceneId) ?? null,
    findActiveScene: () => active
  };
}

describe('requireScene', () => {
  const dungeon = { id: 'dungeon', name: 'Dungeon' };
  const tavern = { id: 'tavern', name: 'Tavern' };

  it('returns the scene with the given id', () => {
    expect(requireScene(locator([dungeon, tavern], tavern), 'dungeon')).toEqual(dungeon);
  });

  it('returns the active scene when no id is given', () => {
    expect(requireScene(locator([dungeon, tavern], tavern), undefined)).toEqual(tavern);
  });

  it('rejects an unknown scene id, even when a scene is active', () => {
    const act = (): SceneIdentity => requireScene(locator([dungeon], dungeon), 'missing');

    expect(act).toThrow(SceneNotFoundError);
    expect(act).toThrow('Scene not found: missing');
  });

  it('rejects a request without an id when no scene is active', () => {
    const act = (): SceneIdentity => requireScene(locator([dungeon], null), undefined);

    expect(act).toThrow(NoActiveSceneError);
    expect(act).toThrow('No active scene; specify sceneId');
  });

  it('treats an empty id as an id, not as "the active scene"', () => {
    expect(() => requireScene(locator([dungeon], dungeon), '')).toThrow('Scene not found: ');
  });
});
