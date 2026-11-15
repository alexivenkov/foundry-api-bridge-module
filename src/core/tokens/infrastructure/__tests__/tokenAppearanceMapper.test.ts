import { toFoundryAppearanceData, toPrototypeToken, toTokenAppearanceDetail } from '../tokenAppearanceMapper';
import { appearanceWriteOptions } from '../writeOptions';
import { prototypeSource, v13TokenSource, v14TokenSource } from './tokenAppearanceSources';

describe('token appearance mapping', () => {
  it('reads a Foundry 13 token, with texture offset and rotation and array detection modes', () => {
    const appearance = toTokenAppearanceDetail(
      v13TokenSource({ detectionModes: [{ id: 'basicSight', enabled: true, range: 30 }, { id: 'seeAll', range: null }] })
    );

    expect(appearance).toMatchObject({
      depth: undefined,
      texture: { offsetX: 0, offsetY: 0, rotation: 0, tint: '#ffffff', fit: 'contain' },
      disposition: 'hostile',
      nameDisplay: 'none',
      barDisplay: 'none',
      bar1: 'attributes.hp',
      bar2: null,
      light: { coloration: 'luminance', negative: false, priority: 0, animation: { type: null } },
      sight: { visionMode: 'basic', range: 0 },
      detectionModes: [
        { id: 'basicSight', enabled: true, range: 30 },
        { id: 'seeAll', enabled: true, range: null }
      ],
      ring: { enabled: false, effects: [], ringColor: null },
      turnMarker: { mode: 'default', animation: null },
      movementAction: null,
      shape: 'rectangle-1',
      locked: false,
      sort: 0
    });
  });

  it('reads a Foundry 14 token, with depth and record detection modes', () => {
    const appearance = toTokenAppearanceDetail(
      v14TokenSource({ detectionModes: { feelTremor: { enabled: false, range: 15 } }, ring: { enabled: true, colors: { ring: '#ff0000', background: null }, effects: 0x13, subject: { scale: 1.2, texture: 'a.webp' } } })
    );

    expect(appearance.depth).toBe(1);
    expect(appearance.texture.offsetX).toBeUndefined();
    expect(appearance.detectionModes).toEqual([{ id: 'feelTremor', enabled: false, range: 15 }]);
    expect(appearance.ring).toEqual({
      enabled: true,
      ringColor: '#ff0000',
      backgroundColor: null,
      effects: ['pulse', 'invisibility'],
      subjectScale: 1.2,
      subjectTexture: 'a.webp'
    });
  });

  it('reads a prototype token with its placement rules', () => {
    expect(toPrototypeToken('a1', prototypeSource({ randomImg: true, appendNumber: true }))).toMatchObject({
      actorId: 'a1',
      name: 'Goblin',
      randomImg: true,
      appendNumber: true,
      prependAdjective: false,
      actorLink: false
    });
  });

  it('writes nested partial objects the core merges, with the core codes', () => {
    const data = toFoundryAppearanceData(
      {
        barDisplay: 'owner-hover',
        bar1: null,
        light: { dim: 30, coloration: 'adaptive-attenuation', animation: { speed: 3 } },
        sight: { brightness: -0.4 },
        occludableRadius: 2,
        ring: { ringColor: null, effects: ['gradient'], subjectScale: 1.5 },
        turnMarker: { mode: 'disabled' },
        movementAction: 'fly'
      },
      appearanceWriteOptions(13)
    );

    expect(data).toEqual({
      displayBars: 20,
      bar1: { attribute: null },
      light: { dim: 30, coloration: 101, animation: { speed: 3 } },
      sight: { brightness: -0.4 },
      occludable: { radius: 2 },
      ring: { colors: { ring: null }, effects: 5, subject: { scale: 1.5 } },
      turnMarker: { mode: 0 },
      movementAction: 'fly'
    });
  });

  it('writes detection modes as an array up to 13 and as a replaced record on 14', () => {
    const modes = [{ id: 'basicSight', enabled: true, range: 30 }];
    expect(toFoundryAppearanceData({ detectionModes: modes }, appearanceWriteOptions(13, {}))).toEqual({
      detectionModes: [{ id: 'basicSight', enabled: true, range: 30 }]
    });

    const create = jest.fn((value: unknown) => ({ replaced: value }));
    const v14 = appearanceWriteOptions(14, { foundry: { data: { operators: { ForcedReplacement: { create } } } } });
    expect(toFoundryAppearanceData({ detectionModes: modes }, v14)).toEqual({
      detectionModes: { replaced: { basicSight: { enabled: true, range: 30 } } }
    });
  });
});
