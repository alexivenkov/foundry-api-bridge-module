import { NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import {
  ActorTokenNotFoundError,
  TokenCreationFailedError,
  TokenNotFoundError,
  hasChanges,
  isUnlinkedCharacter
} from '../../domain';
import { TokenService } from '../TokenService';
import { FakeSceneLocator, FakeTokenStore, token } from './fakePorts';

function setup(activeId: string | null = 'dungeon'): { service: TokenService; store: FakeTokenStore } {
  const store = new FakeTokenStore({
    dungeon: [
      token({ id: 'goblin', actorId: 'a-goblin', x: 0, y: 0 }),
      token({ id: 'ogre', actorId: 'a-ogre', x: 300, y: 0, width: 2, height: 2 }),
      token({ id: 'goblin-2', actorId: 'a-goblin', x: 1000, y: 0 })
    ],
    tavern: [token({ id: 'bard', actorId: 'a-bard' })]
  });
  const scenes = new FakeSceneLocator(['dungeon', 'tavern'], activeId);
  return { service: new TokenService({ scenes, tokens: store, grids: store }), store };
}

describe('TokenService', () => {
  describe('reading', () => {
    it('lists the tokens of the active scene together with the scene', () => {
      const result = setup().service.listTokens({ sceneId: undefined });

      expect(result.scene).toEqual({ id: 'dungeon', name: 'Scene dungeon' });
      expect(result.tokens.map((t) => t.id)).toEqual(['goblin', 'ogre', 'goblin-2']);
    });

    it('rejects an unknown scene and a missing active scene', () => {
      expect(() => setup().service.listTokens({ sceneId: 'missing' })).toThrow(SceneNotFoundError);
      expect(() => setup(null).service.listTokens({ sceneId: undefined })).toThrow(NoActiveSceneError);
    });

    it('finds a token in the named scene', () => {
      expect(setup().service.getToken({ sceneId: 'tavern', tokenId: 'bard' })).toMatchObject({
        sceneId: 'tavern',
        token: { id: 'bard' }
      });
    });

    it('rejects an unknown token', () => {
      expect(() => setup().service.getToken({ sceneId: undefined, tokenId: 'bard' })).toThrow('Token not found: bard');
    });

    it('returns the first token placed for an actor', () => {
      expect(setup().service.getTokenByActor({ sceneId: undefined, actorId: 'a-goblin' }).token.id).toBe('goblin');
    });

    it('rejects an actor without a token on the scene', () => {
      const act = (): unknown => setup().service.getTokenByActor({ sceneId: undefined, actorId: 'a-bard' });

      expect(act).toThrow(ActorTokenNotFoundError);
      expect(act).toThrow('No token for actor a-bard on scene dungeon');
    });
  });

  describe('tokensInRange', () => {
    const query = { sceneId: undefined, originX: 50, originY: 50, range: 15, excludeTokenId: undefined };

    it('returns tokens within range, nearest first, measured to the footprint', () => {
      const result = setup().service.tokensInRange(query);

      expect(result.units).toBe('ft');
      expect(result.tokens.map((entry) => [entry.token.id, entry.distance])).toEqual([
        ['goblin', 0],
        ['ogre', 12.5]
      ]);
    });

    it('leaves out the excluded token', () => {
      const result = setup().service.tokensInRange({ ...query, excludeTokenId: 'goblin' });

      expect(result.tokens.map((entry) => entry.token.id)).toEqual(['ogre']);
    });

    it('falls back to a 100 px, 5 ft grid when the scene does not say', () => {
      const { service, store } = setup();
      store.grid = { size: null, distance: null, units: null };

      const result = service.tokensInRange({ ...query, range: 100 });

      expect(result.units).toBe('ft');
      expect(result.tokens.at(-1)).toMatchObject({ token: { id: 'goblin-2' }, distance: 47.5 });
    });
  });

  describe('writing', () => {
    it('creates a token in the resolved scene', async () => {
      const { service, store } = setup();
      const draft = { actorId: 'a-goblin', x: 5, y: 7 };

      const created = await service.createToken({ sceneId: 'tavern', draft });

      expect(store.created).toEqual([{ sceneId: 'tavern', draft }]);
      expect(created).toMatchObject({ id: 'created', x: 5, y: 7 });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createToken({ sceneId: undefined, draft: { actorId: 'a', x: 0, y: 0 } }))
        .rejects.toThrow(TokenCreationFailedError);
    });

    it('applies changes to an existing token', async () => {
      const { service, store } = setup();

      const updated = await service.updateToken({ sceneId: undefined, tokenId: 'goblin', changes: { hidden: true } });

      expect(store.updated).toEqual([{ tokenId: 'goblin', changes: { hidden: true } }]);
      expect(updated.hidden).toBe(true);
    });

    it('returns the token untouched when there is nothing to change', async () => {
      const { service, store } = setup();

      const updated = await service.updateToken({
        sceneId: undefined,
        tokenId: 'goblin',
        changes: { hidden: undefined, name: undefined }
      });

      expect(store.updated).toEqual([]);
      expect(updated.id).toBe('goblin');
    });

    it('rejects an unknown token on update and delete', async () => {
      const { service, store } = setup();

      await expect(service.updateToken({ sceneId: undefined, tokenId: 'missing', changes: { hidden: true } }))
        .rejects.toThrow(TokenNotFoundError);
      await expect(service.deleteToken({ sceneId: undefined, tokenId: 'missing' })).rejects.toThrow(TokenNotFoundError);
      expect(store.deleted).toEqual([]);
    });

    it('deletes an existing token', async () => {
      const { service, store } = setup();

      await service.deleteToken({ sceneId: undefined, tokenId: 'ogre' });

      expect(store.deleted).toEqual(['ogre']);
    });
  });
});

describe('token rules', () => {
  it('flags a player character placed as an unlinked copy', () => {
    const character = { id: 'a1', type: 'character', statuses: [], vitals: { hp: null, ac: null } };

    expect(isUnlinkedCharacter(token({ actorLink: false, actor: character }))).toBe(true);
    expect(isUnlinkedCharacter(token({ actorLink: true, actor: character }))).toBe(false);
    expect(isUnlinkedCharacter(token({ actorLink: false }))).toBe(false);
    expect(isUnlinkedCharacter(token({ actorLink: false, actor: null }))).toBe(false);
  });

  it('sees no changes when every attribute is absent', () => {
    expect(hasChanges({})).toBe(false);
    expect(hasChanges({ hidden: undefined })).toBe(false);
    expect(hasChanges({ hidden: false })).toBe(true);
  });
});
