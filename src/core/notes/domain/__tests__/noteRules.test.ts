import { CoreFeatureUnavailableError } from '../../../shared';
import { UnknownNoteLevelError, assertNoteFeatures, assertNoteLevels } from '..';

describe('note rules', () => {
  it('refuses a lock or levels on a core without scene levels', () => {
    expect(() => assertNoteFeatures({ locked: true }, { levels: false })).toThrow(
      new CoreFeatureUnavailableError('Note locks and scene levels require Foundry 14 or newer')
    );
    expect(() => assertNoteFeatures({ levels: [] }, { levels: false })).toThrow(CoreFeatureUnavailableError);
    expect(() => assertNoteFeatures({ elevation: 5, sort: 1, fontFamily: null }, { levels: false })).not.toThrow();
  });

  it('refuses a level that is not in the scene', () => {
    expect(() => assertNoteLevels(['lvl1', 'ghost'], ['lvl1'])).toThrow(new UnknownNoteLevelError('ghost'));
    expect(() => assertNoteLevels(['lvl1'], ['lvl1'])).not.toThrow();
    expect(() => assertNoteLevels(undefined, [])).not.toThrow();
  });
});
