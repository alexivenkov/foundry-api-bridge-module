import { parseRequest } from '../../../shared';
import { createWallRequestSchema, toCreateWallCommand, toUpdateWallCommand, updateWallRequestSchema } from '..';

describe('wall detail validation', () => {
  it('maps threshold, door sound and animation to the draft', () => {
    const command = toCreateWallCommand(
      parseRequest(createWallRequestSchema, {
        c: [0, 0, 10, 10],
        threshold: { sight: { proximity: 'proximity', distance: 2.5 }, attenuation: true },
        doorSound: 'jail',
        animation: { type: 'slide', reverse: true, duration: 600, strength: 0.35, texture: null }
      })
    );
    expect(command.draft).toMatchObject({
      threshold: { sight: { proximity: 'proximity', distance: 2.5 }, attenuation: true },
      doorSound: 'jail',
      animation: { type: 'slide', reverse: true, duration: 600, strength: 0.35, texture: null }
    });
  });

  it('reads an empty door sound as none', () => {
    const command = toUpdateWallCommand(parseRequest(updateWallRequestSchema, { wallId: 'w', doorSound: '' }));
    expect(command.changes.doorSound).toBeNull();
  });

  it.each([
    ['a zero threshold distance', { threshold: { light: { distance: 0 } } }],
    ['an unknown proximity mode', { threshold: { light: { proximity: 'near' } } }],
    ['a zero animation duration', { animation: { duration: 0 } }],
    ['a fractional animation duration', { animation: { duration: 10.5 } }],
    ['a strength off the 0.05 grid', { animation: { strength: 0.33 } }],
    ['a strength above 2', { animation: { strength: 3 } }],
    ['an empty animation type', { animation: { type: '' } }]
  ])('rejects %s instead of letting the core change it', (_label, fields) => {
    expect(() => parseRequest(updateWallRequestSchema, { wallId: 'w', ...fields })).toThrow();
  });

  it('keeps tolerating an out-of-enum plain restriction', () => {
    expect(parseRequest(updateWallRequestSchema, { wallId: 'w', sense: 'bogus' }).sense).toBeUndefined();
  });
});
