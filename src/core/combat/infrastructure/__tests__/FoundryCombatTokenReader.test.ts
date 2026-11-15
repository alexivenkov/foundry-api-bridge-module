import { CombatNotFoundError } from '../../domain';
import { FoundryCombatTokenReader } from '../FoundryCombatTokenReader';
import { encounterDocument, worldWith } from './fakeWorld';

function readerFor(options: Parameters<typeof worldWith>[1], combats = [encounterDocument().document]) {
  const { game } = worldWith(combats, options);
  return new FoundryCombatTokenReader({ getGame: () => game });
}

describe('FoundryCombatTokenReader', () => {
  const tokens = {
    crypt: [{ id: 'wolf', actorId: 'wolf-actor', hidden: true }],
    tavern: [{ id: 'patron', actorId: null, hidden: false }]
  };

  it('reads a token with its scene, actor and hidden flag', () => {
    expect(readerFor({ tokens }).findToken('crypt', 'wolf')).toEqual({
      id: 'wolf',
      sceneId: 'crypt',
      actorId: 'wolf-actor',
      hidden: true
    });
  });

  it('reads a token that stands for no actor', () => {
    expect(readerFor({ tokens }).findToken('tavern', 'patron')?.actorId).toBeNull();
  });

  it('finds no token on another scene, an unknown one or an unknown scene', () => {
    const reader = readerFor({ tokens });

    expect(reader.findToken('tavern', 'wolf')).toBeNull();
    expect(reader.findToken('crypt', 'bear')).toBeNull();
    expect(reader.findToken('moon', 'wolf')).toBeNull();
  });

  it('finds a token on the active scene by its id', () => {
    expect(readerFor({ tokens, activeScene: 'crypt' }).findToken('crypt', 'wolf')?.id).toBe('wolf');
  });

  it('reads the scene an encounter is linked to', () => {
    const linked = encounterDocument({ id: 'linked', scene: { id: 'crypt' } }).document;
    const unlinked = encounterDocument({ id: 'unlinked' }).document;
    const reader = readerFor({}, [linked, unlinked]);

    expect(reader.linkedSceneId('linked')).toBe('crypt');
    expect(reader.linkedSceneId('unlinked')).toBeNull();
    expect(() => reader.linkedSceneId('gone')).toThrow(CombatNotFoundError);
  });
});
