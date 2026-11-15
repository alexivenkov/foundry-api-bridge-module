import { ActorNotFoundError, CoreFeatureUnavailableError, type ActorIdentity, type ActorLocator } from '../../../shared';
import {
  TokenCreationFailedError,
  TokenNotFoundError,
  TokenScaleConflictError,
  type ActorTokenPlacement,
  type PrototypeToken,
  type PrototypeTokenChanges,
  type PrototypeTokenStore,
  type Token,
  type TokenAppearanceDetail,
  type TokenAppearanceEnvironment,
  type TokenDraft
} from '../../domain';
import { TokenAppearanceService } from '../TokenAppearanceService';
import { TokenService } from '../TokenService';
import { FakeSceneLocator, FakeTokenStore, token } from './fakePorts';

const BASE_APPEARANCE: TokenAppearanceDetail = {
  width: 1,
  height: 1,
  depth: undefined,
  texture: { src: 'a.webp', tint: '#ffffff', fit: 'contain', anchorX: 0.5, anchorY: 0.5, scaleX: 1, scaleY: 1, alphaThreshold: 0.75, offsetX: 0, offsetY: 0, rotation: 0 },
  alpha: 1,
  rotation: 0,
  lockRotation: false,
  disposition: 'hostile',
  nameDisplay: 'none',
  barDisplay: 'none',
  bar1: null,
  bar2: null,
  light: {
    dim: 0,
    bright: 0,
    angle: 360,
    color: null,
    alpha: 0.5,
    coloration: 'luminance',
    luminosity: 0.5,
    attenuation: 0.5,
    saturation: 0,
    contrast: 0,
    shadows: 0,
    animation: { type: null, speed: 5, intensity: 5, reverse: false },
    darkness: { min: 0, max: 0.4 },
    negative: true,
    priority: 0
  },
  sight: { enabled: false, range: 0, angle: 360, visionMode: 'basic', color: null, attenuation: 0.1, brightness: 0, saturation: 0, contrast: 0 },
  detectionModes: [],
  occludableRadius: 0,
  ring: undefined,
  turnMarker: undefined,
  movementAction: null,
  shape: 'rectangle-1',
  locked: false,
  sort: 0
};

const PROTOTYPE: PrototypeToken = {
  ...BASE_APPEARANCE,
  light: { ...BASE_APPEARANCE.light, negative: false, darkness: { min: 0, max: 1 } },
  actorId: 'a1',
  name: 'Goblin',
  actorLink: false,
  randomImg: true,
  appendNumber: true,
  prependAdjective: false
};

class FakePrototypes implements PrototypeTokenStore {
  readonly fromPrototype: Array<{ sceneId: string; draft: TokenDraft }> = [];
  readonly updates: PrototypeTokenChanges[] = [];
  createsNothing = false;

  findPrototype(actorId: string): PrototypeToken | null {
    return actorId === 'a1' ? PROTOTYPE : null;
  }
  updatePrototype(_actorId: string, changes: PrototypeTokenChanges): Promise<PrototypeToken | null> {
    this.updates.push(changes);
    return Promise.resolve({ ...PROTOTYPE, name: changes.name ?? PROTOTYPE.name });
  }
  tokenImages(): Promise<readonly string[]> {
    return Promise.resolve(['g1.webp', 'g2.webp']);
  }
  createFromPrototype(sceneId: string, draft: TokenDraft): Promise<Token | null> {
    this.fromPrototype.push({ sceneId, draft });
    return Promise.resolve(this.createsNothing ? null : token({ id: 'proto', name: 'Goblin (1)' }));
  }
}

const actors: ActorLocator = {
  findWorldActor: (actorId): ActorIdentity | null => (actorId === 'a1' ? { id: 'a1', name: 'Goblin' } : null),
  findToken: () => null
};

function environment(features = { ring: true, darknessSources: true, movement: true, depth: false, textureOffset: true }): TokenAppearanceEnvironment {
  return {
    features: () => features,
    lightAnimations: (kind) => (kind === 'darkness' ? ['magicalGloom'] : ['torch']),
    visionModes: () => ['basic', 'darkvision'],
    visionModeDefaults: (mode) => (mode === 'darkvision' ? { attenuation: 0, saturation: -1 } : {}),
    detectionModes: () => ['basicSight'],
    movementActions: () => ['walk'],
    turnMarkerAnimations: () => []
  };
}

const PLACEMENTS: ActorTokenPlacement[] = [
  { sceneId: 'keep', sceneName: 'Keep', sceneActive: true, tokenId: 't1', name: 'Goblin', x: 0, y: 0, elevation: 0, hidden: false, actorLink: false }
];

function setup(env = environment()): { service: TokenAppearanceService; store: FakeTokenStore; prototypes: FakePrototypes } {
  const store = new FakeTokenStore({ keep: [token({ id: 't1' })] });
  const scenes = new FakeSceneLocator(['keep'], 'keep');
  const prototypes = new FakePrototypes();
  const service = new TokenAppearanceService({
    scenes,
    actors,
    tokens: new TokenService({ scenes, tokens: store, grids: store }),
    appearance: { findAppearance: (_sceneId, tokenId) => (tokenId === 't1' || tokenId === 'created' ? BASE_APPEARANCE : null) },
    environment: env,
    prototypes,
    actorTokens: { listActorTokens: (actorId) => (actorId === 'a1' ? PLACEMENTS : []) }
  });
  return { service, store, prototypes };
}

describe('TokenAppearanceService', () => {
  describe('createToken', () => {
    it('creates through the plain token store and adds the appearance on request', async () => {
      const { service, store } = setup();

      const result = await service.createToken({
        sceneId: undefined,
        draft: { actorId: 'a1', x: 1, y: 2, sight: { visionMode: 'darkvision', applyModeDefaults: true, range: 60 } },
        fromPrototype: false,
        includeAppearance: true
      });

      expect(store.created[0]?.draft.sight).toEqual({ attenuation: 0, saturation: -1, visionMode: 'darkvision', range: 60 });
      expect(result).toMatchObject({ sceneId: 'keep', token: { id: 'created' }, appearance: BASE_APPEARANCE });
    });

    it('builds the token from the prototype when asked to', async () => {
      const { service, store, prototypes } = setup();

      const result = await service.createToken({
        sceneId: 'keep',
        draft: { actorId: 'a1', x: 1, y: 2, hidden: true },
        fromPrototype: true,
        includeAppearance: false
      });

      expect(store.created).toEqual([]);
      expect(prototypes.fromPrototype).toEqual([{ sceneId: 'keep', draft: { actorId: 'a1', x: 1, y: 2, hidden: true, sight: undefined } }]);
      expect(result.appearance).toBeNull();
      expect(result.token.name).toBe('Goblin (1)');
    });

    it('needs a world actor for the prototype, and fails when the core creates nothing', async () => {
      const { service, prototypes } = setup();
      const command = { sceneId: undefined, draft: { actorId: 'ghost', x: 0, y: 0 }, fromPrototype: true, includeAppearance: false };

      await expect(service.createToken(command)).rejects.toThrow(ActorNotFoundError);
      prototypes.createsNothing = true;
      await expect(service.createToken({ ...command, draft: { ...command.draft, actorId: 'a1' } })).rejects.toThrow(
        TokenCreationFailedError
      );
    });

    it('refuses a field the running generation does not store, before writing', async () => {
      const { service, store } = setup();

      await expect(
        service.createToken({ sceneId: undefined, draft: { actorId: 'a1', x: 0, y: 0, depth: 2 }, fromPrototype: false, includeAppearance: false })
      ).rejects.toThrow(CoreFeatureUnavailableError);
      expect(store.created).toEqual([]);
    });

    it('refuses the legacy scale together with a texture scale', async () => {
      await expect(
        setup().service.createToken({
          sceneId: undefined,
          draft: { actorId: 'a1', x: 0, y: 0, scale: 2, texture: { scaleX: 1 } },
          fromPrototype: false,
          includeAppearance: false
        })
      ).rejects.toThrow(TokenScaleConflictError);
    });
  });

  describe('updateToken', () => {
    it('checks a light change against the current light of the token', async () => {
      const { service, store } = setup();

      await expect(
        service.updateToken({ sceneId: undefined, tokenId: 't1', changes: { light: { animation: { type: 'torch' } } }, includeAppearance: false })
      ).rejects.toThrow('Unknown darkness animation: torch');
      await expect(
        service.updateToken({ sceneId: undefined, tokenId: 't1', changes: { light: { darkness: { min: 0.5 } } }, includeAppearance: false })
      ).rejects.toThrow('Light darkness range min (0.5) may not exceed max (0.4)');
      expect(store.updated).toEqual([]);
    });

    it('writes the changes through the plain token store', async () => {
      const { service, store } = setup();

      const result = await service.updateToken({
        sceneId: 'keep',
        tokenId: 't1',
        changes: { hidden: true, ring: { enabled: true } },
        includeAppearance: false
      });

      expect(store.updated).toEqual([{ tokenId: 't1', changes: { hidden: true, ring: { enabled: true }, sight: undefined } }]);
      expect(result.token.hidden).toBe(true);
    });

    it('reports a token that is gone', async () => {
      await expect(
        setup().service.updateToken({ sceneId: undefined, tokenId: 'ghost', changes: { light: { dim: 5 } }, includeAppearance: false })
      ).rejects.toThrow(TokenNotFoundError);
    });
  });

  describe('prototypes and actor tokens', () => {
    it('reads and updates the prototype of a world actor', async () => {
      const { service, prototypes } = setup();

      expect(service.getPrototype({ actorId: 'a1' })).toBe(PROTOTYPE);
      const updated = await service.updatePrototype({ actorId: 'a1', changes: { name: 'Gob', sight: { visionMode: 'darkvision', applyModeDefaults: true } } });

      expect(prototypes.updates[0]).toEqual({ name: 'Gob', sight: { attenuation: 0, saturation: -1, visionMode: 'darkvision' } });
      expect(updated.name).toBe('Gob');
    });

    it('refuses an unknown actor for every prototype command', async () => {
      const { service } = setup();
      expect(() => service.getPrototype({ actorId: 'ghost' })).toThrow('Actor not found: ghost');
      expect(() => service.listActorTokens({ actorId: 'ghost' })).toThrow(ActorNotFoundError);
      await expect(service.getTokenImages({ actorId: 'ghost' })).rejects.toThrow(ActorNotFoundError);
      await expect(service.updatePrototype({ actorId: 'ghost', changes: {} })).rejects.toThrow(ActorNotFoundError);
    });

    it('lists the wildcard images with the prototype setting, and the placed tokens', async () => {
      const { service } = setup();
      await expect(service.getTokenImages({ actorId: 'a1' })).resolves.toEqual({ actorId: 'a1', randomImg: true, images: ['g1.webp', 'g2.webp'] });
      expect(service.listActorTokens({ actorId: 'a1' })).toEqual({ actorId: 'a1', tokens: PLACEMENTS });
    });

    it('reads the appearance of a token, null when it cannot', () => {
      const { service } = setup();
      expect(service.getAppearance({ sceneId: undefined, tokenId: 't1' })).toBe(BASE_APPEARANCE);
      expect(service.getAppearance({ sceneId: undefined, tokenId: 'ghost' })).toBeNull();
    });
  });
});
