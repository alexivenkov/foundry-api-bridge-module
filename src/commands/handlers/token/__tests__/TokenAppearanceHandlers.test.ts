import { createCreateTokenHandler } from '../CreateTokenHandler';
import { createGetActorTokensHandler } from '../GetActorTokensHandler';
import { createGetPrototypeTokenHandler } from '../GetPrototypeTokenHandler';
import { createGetTokenHandler } from '../GetTokenHandler';
import { createGetTokenImagesHandler } from '../GetTokenImagesHandler';
import { createUpdatePrototypeTokenHandler } from '../UpdatePrototypeTokenHandler';
import { createUpdateTokenHandler } from '../UpdateTokenHandler';
import type { FoundryPrototypeActor, FoundryTokenDocument, FoundryTokenSource, TokenAppearanceGame } from '../tokenTypes';

function source(overrides: Partial<FoundryTokenSource> = {}): FoundryTokenSource {
  return {
    name: 'Goblin',
    displayName: 0,
    actorLink: false,
    width: 1,
    height: 1,
    depth: 1,
    texture: { src: 'goblin.webp', anchorX: 0.5, anchorY: 0.5, fit: 'contain', scaleX: 1, scaleY: 1, tint: '#ffffff', alphaThreshold: 0.75 },
    lockRotation: false,
    rotation: 0,
    alpha: 1,
    disposition: -1,
    displayBars: 0,
    bar1: { attribute: 'attributes.hp' },
    bar2: { attribute: null },
    light: {
      negative: false,
      priority: 0,
      alpha: 0.5,
      angle: 360,
      bright: 0,
      color: null,
      coloration: 1,
      dim: 0,
      attenuation: 0.5,
      luminosity: 0.5,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: { type: null, speed: 5, intensity: 5, reverse: false },
      darkness: { min: 0, max: 1 }
    },
    sight: { enabled: true, range: 60, angle: 360, visionMode: 'darkvision', color: null, attenuation: 0, brightness: 0, saturation: -1, contrast: 0 },
    detectionModes: { basicSight: { enabled: true, range: 60 } },
    occludable: { radius: 0 },
    ring: { enabled: false, colors: { ring: null, background: null }, effects: 1, subject: { scale: 1, texture: null } },
    turnMarker: { mode: 1, animation: null, src: null, disposition: false },
    movementAction: null,
    shape: 4,
    locked: false,
    sort: 0,
    ...overrides
  };
}

function tokenDocument(id: string): FoundryTokenDocument {
  const doc: FoundryTokenDocument = {
    id,
    name: 'Goblin',
    x: 100,
    y: 200,
    width: 1,
    height: 1,
    elevation: 0,
    rotation: 0,
    hidden: false,
    texture: { src: 'goblin.webp' },
    disposition: -1,
    actorId: 'a1',
    actorLink: false,
    actor: null,
    _source: source(),
    update: jest.fn(),
    delete: jest.fn()
  };
  (doc.update as jest.Mock).mockImplementation((data: Record<string, unknown>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

interface Setup {
  deps: { gameProvider: { getGame(): TokenAppearanceGame }; globals: () => object; generation: () => number };
  token: FoundryTokenDocument;
  create: jest.Mock;
  actor: FoundryPrototypeActor;
}

function setup(): Setup {
  const token = tokenDocument('t1');
  const placed = new Map<string, FoundryTokenDocument>([['t1', token]]);
  const create = jest.fn(() => {
    const created = tokenDocument('t2');
    placed.set(created.id, created);
    return Promise.resolve([created]);
  });
  const actor: FoundryPrototypeActor = {
    id: 'a1',
    _source: { prototypeToken: { ...source(), randomImg: true, appendNumber: true, prependAdjective: false } },
    update: jest.fn().mockResolvedValue(undefined),
    getTokenImages: jest.fn().mockResolvedValue(['goblin-1.webp']),
    getTokenDocument: jest.fn().mockResolvedValue({ updateSource: jest.fn() })
  };
  const scene = {
    id: 'keep',
    name: 'Keep',
    active: true,
    tokens: { get: (id: string) => placed.get(id), contents: [token] },
    createEmbeddedDocuments: create
  };
  const game = {
    scenes: { get: (id: string) => (id === 'keep' ? scene : undefined), active: scene, contents: [scene] },
    actors: { get: (id: string) => (id === 'a1' ? { ...actor, name: 'Goblin' } : undefined) }
  } as unknown as TokenAppearanceGame;
  const globals = (): object => ({
    CONFIG: { Canvas: { visionModes: { basic: { vision: { defaults: {} } }, darkvision: { vision: { defaults: { saturation: -1, attenuation: 0 } } } } } }
  });
  return { deps: { gameProvider: { getGame: () => game }, globals, generation: () => 14 }, token, create, actor };
}

describe('token appearance handlers', () => {
  it('creates a token with appearance fields and returns the appearance on request', async () => {
    const { deps, create } = setup();

    const result = await createCreateTokenHandler(deps)({
      actorId: 'a1',
      x: 100,
      y: 200,
      depth: 2,
      light: { dim: 30, color: '#f80' },
      includeAppearance: true
    });

    expect(create).toHaveBeenCalledWith('Token', [{ actorId: 'a1', x: 100, y: 200, depth: 2, light: { dim: 30, color: '#ff8800' } }]);
    expect(result.id).toBe('t2');
    expect(result.appearance).toMatchObject({ depth: 1, sight: { visionMode: 'darkvision' }, detectionModes: [{ id: 'basicSight', range: 60 }] });
  });

  it('creates a token from the prototype on request', async () => {
    const { deps, actor, create } = setup();

    await createCreateTokenHandler(deps)({ actorId: 'a1', x: 10, y: 20, fromPrototype: true });

    expect(actor.getTokenDocument).toHaveBeenCalledWith({ actorId: 'a1', x: 10, y: 20 }, expect.objectContaining({ parent: expect.anything() as unknown }));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('applies the vision mode defaults on update when asked to', async () => {
    const { deps, token } = setup();

    await createUpdateTokenHandler(deps)({ tokenId: 't1', sight: { visionMode: 'darkvision', applyModeDefaults: true, range: 30 } });

    expect(token.update).toHaveBeenCalledWith({ sight: { saturation: -1, attenuation: 0, visionMode: 'darkvision', range: 30 } });
  });

  it('rejects a field the running generation does not store', async () => {
    const { deps } = setup();
    await expect(createUpdateTokenHandler(deps)({ tokenId: 't1', texture: { offsetX: 3 } })).rejects.toThrow(
      'Token texture offset and rotation are not available in Foundry 14 or newer'
    );
  });

  it('rejects an invalid value and reports a missing token', async () => {
    const { deps } = setup();
    await expect(createUpdateTokenHandler(deps)({ tokenId: 't1', alpha: 2 })).rejects.toThrow('alpha');
    await expect(createUpdateTokenHandler(deps)({ tokenId: 'ghost', hidden: true })).rejects.toThrow('Token not found: ghost');
  });

  it('adds the appearance to get-token only on request', async () => {
    const { deps } = setup();
    const handler = createGetTokenHandler(deps);

    expect(await handler({ tokenId: 't1' })).not.toHaveProperty('appearance');
    expect((await handler({ tokenId: 't1', includeAppearance: true })).appearance).toMatchObject({ shape: 'rectangle-1', locked: false, sort: 0 });
  });

  it('reads and updates the prototype token', async () => {
    const { deps, actor } = setup();

    expect(await createGetPrototypeTokenHandler(deps)({ actorId: 'a1' })).toMatchObject({
      actorId: 'a1',
      name: 'Goblin',
      randomImg: true,
      appendNumber: true,
      sight: { visionMode: 'darkvision' }
    });
    await createUpdatePrototypeTokenHandler(deps)({ actorId: 'a1', name: 'Gob', disposition: 'neutral' });
    expect(actor.update).toHaveBeenCalledWith({ prototypeToken: { name: 'Gob', disposition: 0 } });
    await expect(createGetPrototypeTokenHandler(deps)({ actorId: 'ghost' })).rejects.toThrow('Actor not found: ghost');
  });

  it('lists the tokens of an actor and its wildcard images', async () => {
    const { deps } = setup();

    expect(await createGetActorTokensHandler(deps)({ actorId: 'a1' })).toEqual({
      actorId: 'a1',
      tokens: [
        { sceneId: 'keep', sceneName: 'Keep', sceneActive: true, tokenId: 't1', name: 'Goblin', x: 100, y: 200, elevation: 0, hidden: false, actorLink: false }
      ]
    });
    expect(await createGetTokenImagesHandler(deps)({ actorId: 'a1' })).toEqual({ actorId: 'a1', randomImg: true, images: ['goblin-1.webp'] });
    await expect(createGetTokenImagesHandler(deps)({ actorId: '' })).rejects.toThrow('actorId');
  });
});
