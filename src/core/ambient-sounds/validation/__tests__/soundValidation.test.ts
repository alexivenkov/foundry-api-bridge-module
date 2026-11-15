import { ValidationError } from '../../../../kernel';
import { parseRequest } from '../../../shared';
import {
  createAmbientSoundRequestSchema,
  deleteAmbientSoundRequestSchema,
  getAmbientSoundsRequestSchema,
  playSoundAtPositionRequestSchema,
  preloadSoundRequestSchema,
  toCreateAmbientSoundCommand,
  toDeleteAmbientSoundCommand,
  toListAmbientSoundsQuery,
  toPlaySoundAtPositionCommand,
  toPreloadSoundCommand,
  toUpdateAmbientSoundCommand,
  updateAmbientSoundRequestSchema
} from '..';

const BASE = { x: 1, y: 2, radius: 10, path: 'sounds/wind.ogg' };

describe('ambient sound request schemas', () => {
  it('reads null or empty sceneId as the active scene', () => {
    expect(toListAmbientSoundsQuery(parseRequest(getAmbientSoundsRequestSchema, { sceneId: null }))).toEqual({
      sceneId: undefined
    });
    expect(toListAmbientSoundsQuery(parseRequest(getAmbientSoundsRequestSchema, { sceneId: 's' }))).toEqual({ sceneId: 's' });
  });

  it.each([
    [{ path: undefined }, /^path: /],
    [{ path: 'sounds/wind.mp4' }, /^path: must be one audio file/],
    [{ path: 'sounds/*.ogg' }, /^path: /],
    [{ path: '   ' }, /^path: /],
    [{ radius: 0 }, /^radius: /],
    [{ radius: undefined }, /^radius: /],
    [{ volume: 1.2 }, /^volume: /],
    [{ darkness: { min: -0.1 } }, /^darkness\.min: /],
    [{ baseEffect: { intensity: 11 } }, /^baseEffect\.intensity: /],
    [{ muffledEffect: { intensity: 2.5 } }, /^muffledEffect\.intensity: /],
    [{ levels: 'lvl' }, /^levels: /]
  ])('rejects %p on create', (attributes, message) => {
    expect(() => parseRequest(createAmbientSoundRequestSchema, { ...BASE, ...attributes })).toThrow(message);
  });

  it('maps a full create request', () => {
    const command = toCreateAmbientSoundCommand(
      parseRequest(createAmbientSoundRequestSchema, {
        ...BASE,
        sceneId: 'cave',
        path: '  sounds/wind.OGG?v=2  ',
        elevation: 3,
        repeat: true,
        volume: 0.7,
        walls: false,
        easing: false,
        hidden: true,
        darkness: { min: 0.2, max: 0.9 },
        baseEffect: { type: 'reverb', intensity: 3 },
        muffledEffect: { type: '' },
        name: 'Wind',
        locked: true,
        levels: ['lvl']
      })
    );
    expect(command).toEqual({
      sceneId: 'cave',
      draft: {
        x: 1,
        y: 2,
        radius: 10,
        path: 'sounds/wind.OGG?v=2',
        elevation: 3,
        repeat: true,
        volume: 0.7,
        walls: false,
        easing: false,
        hidden: true,
        darkness: { min: 0.2, max: 0.9 },
        baseEffect: { type: 'reverb', intensity: 3 },
        muffledEffect: { type: null, intensity: undefined },
        name: 'Wind',
        locked: true,
        levels: ['lvl']
      }
    });
  });

  it('lets an update detach the file, and requires the sound id', () => {
    const command = toUpdateAmbientSoundCommand(
      parseRequest(updateAmbientSoundRequestSchema, { ambientSoundId: 'a1', path: null, name: '' })
    );
    expect(command).toMatchObject({ sceneId: undefined, ambientSoundId: 'a1', changes: { path: null, name: null } });
    expect(() => parseRequest(updateAmbientSoundRequestSchema, { path: null })).toThrow(/^ambientSoundId: /);
    expect(() => parseRequest(updateAmbientSoundRequestSchema, { ambientSoundId: 'a1', path: 'x.txt' })).toThrow(
      ValidationError
    );
  });

  it('maps a delete request', () => {
    expect(
      toDeleteAmbientSoundCommand(parseRequest(deleteAmbientSoundRequestSchema, { ambientSoundId: 'a1', sceneId: '' }))
    ).toEqual({ sceneId: undefined, ambientSoundId: 'a1' });
  });
});

describe('play-sound-at-position schema', () => {
  it('applies the core defaults', () => {
    expect(
      toPlaySoundAtPositionCommand(parseRequest(playSoundAtPositionRequestSchema, { src: 'sounds/trap.ogg', x: 5, y: 6, radius: 30 }))
    ).toEqual({
      sceneId: undefined,
      sound: {
        src: 'sounds/trap.ogg',
        x: 5,
        y: 6,
        elevation: undefined,
        radius: 30,
        volume: 1,
        easing: true,
        walls: true,
        gmAlways: true,
        baseEffect: undefined,
        muffledEffect: undefined
      }
    });
  });

  it('keeps the given options', () => {
    const command = toPlaySoundAtPositionCommand(
      parseRequest(playSoundAtPositionRequestSchema, {
        src: 'sounds/trap.ogg',
        x: 5,
        y: 6,
        elevation: 10,
        radius: 30,
        volume: 0,
        easing: false,
        walls: false,
        gmAlways: false,
        baseEffect: { type: 'reverb' },
        muffledEffect: { type: 'lowpass', intensity: 7 },
        sceneId: 'cave'
      })
    );
    expect(command).toEqual({
      sceneId: 'cave',
      sound: {
        src: 'sounds/trap.ogg',
        x: 5,
        y: 6,
        elevation: 10,
        radius: 30,
        volume: 0,
        easing: false,
        walls: false,
        gmAlways: false,
        baseEffect: { type: 'reverb', intensity: undefined },
        muffledEffect: { type: 'lowpass', intensity: 7 }
      }
    });
  });

  it.each([
    [{ radius: 0 }, /^radius: /],
    [{ radius: -5 }, /^radius: /],
    [{ volume: 2 }, /^volume: /],
    [{ src: 'sounds/trap' }, /^src: /],
    [{ baseEffect: { type: '' } }, /^baseEffect\.type: /],
    [{ baseEffect: { intensity: 3 } }, /^baseEffect\.type: /],
    [{ x: 'left' }, /^x: /]
  ])('rejects %p', (attributes, message) => {
    expect(() =>
      parseRequest(playSoundAtPositionRequestSchema, { src: 'sounds/trap.ogg', x: 5, y: 6, radius: 30, ...attributes })
    ).toThrow(message);
  });
});

describe('preload-sound schema', () => {
  it('accepts one audio file and rejects anything else', () => {
    expect(toPreloadSoundCommand(parseRequest(preloadSoundRequestSchema, { src: 'music/theme.mp3' }))).toEqual({
      src: 'music/theme.mp3'
    });
    expect(() => parseRequest(preloadSoundRequestSchema, { src: 'music/theme.flv' })).toThrow(/^src: /);
    expect(() => parseRequest(preloadSoundRequestSchema, {})).toThrow(/^src: /);
  });
});
