import {
  applyTrackerConfigChanges,
  canLinkToScene,
  hasCombatantChanges,
  hasGroupChanges,
  hasTokenCombatant,
  hasTrackerConfigChanges,
  type CombatTrackerConfig,
  type Encounter
} from '..';
import { combatant } from './fixtures';

function encounter(combatantSceneIds: string[]): Encounter {
  return {
    id: 'fight',
    sceneId: null,
    active: true,
    isDefault: true,
    started: false,
    round: 0,
    turn: null,
    combatantCount: combatantSceneIds.length,
    combatantSceneIds
  };
}

const MARKED: CombatTrackerConfig = {
  resource: 'attributes.hp.value',
  skipDefeated: false,
  turnMarker: { enabled: true, animation: 'spin', src: null, disposition: false }
};

describe('linking an encounter to a scene', () => {
  it('is allowed when no combatant is placed on a scene of its own', () => {
    expect(canLinkToScene(encounter([]), 'crypt')).toBe(true);
  });

  it('is allowed when every placed combatant is on that scene', () => {
    expect(canLinkToScene(encounter(['crypt']), 'crypt')).toBe(true);
  });

  it('is refused while a combatant is placed on another scene', () => {
    expect(canLinkToScene(encounter(['crypt', 'tavern']), 'crypt')).toBe(false);
  });
});

describe('combatant changes', () => {
  it('count a group change, also one that clears the group', () => {
    expect(hasCombatantChanges({ groupId: 'wolves' })).toBe(true);
    expect(hasCombatantChanges({ groupId: null })).toBe(true);
    expect(hasCombatantChanges({ groupId: undefined })).toBe(false);
  });
});

describe('a token in an encounter', () => {
  it('is known by its token id', () => {
    const combatants = [combatant({ tokenId: 'wolf' }), combatant({ id: 'c2', tokenId: null })];

    expect(hasTokenCombatant(combatants, 'wolf')).toBe(true);
    expect(hasTokenCombatant(combatants, 'bear')).toBe(false);
  });
});

describe('group changes', () => {
  it('count a cleared attribute and ignore an omitted one', () => {
    expect(hasGroupChanges({ name: null })).toBe(true);
    expect(hasGroupChanges({ initiative: 0 })).toBe(true);
    expect(hasGroupChanges({ name: undefined, img: undefined })).toBe(false);
  });
});

describe('tracker configuration changes', () => {
  it('count a field of the turn marker as a change', () => {
    expect(hasTrackerConfigChanges({ turnMarker: { enabled: false } })).toBe(true);
    expect(hasTrackerConfigChanges({ resource: null })).toBe(true);
  });

  it('do not count an empty turn marker or nothing at all', () => {
    expect(hasTrackerConfigChanges({})).toBe(false);
    expect(hasTrackerConfigChanges({ turnMarker: {} })).toBe(false);
    expect(hasTrackerConfigChanges({ skipDefeated: undefined, turnMarker: { src: undefined } })).toBe(false);
  });

  it('are merged into the current configuration, field by field', () => {
    expect(
      applyTrackerConfigChanges(MARKED, { skipDefeated: true, turnMarker: { animation: 'pulse', src: 'marker.webm' } })
    ).toEqual({
      resource: 'attributes.hp.value',
      skipDefeated: true,
      turnMarker: { enabled: true, animation: 'pulse', src: 'marker.webm', disposition: false }
    });
  });

  it('clear the resource and the marker source with null', () => {
    const marked = { ...MARKED, turnMarker: { ...MARKED.turnMarker, src: 'marker.webm' } } as CombatTrackerConfig;

    expect(applyTrackerConfigChanges(marked, { resource: null, turnMarker: { src: null } })).toMatchObject({
      resource: null,
      turnMarker: { src: null }
    });
  });

  it('leave out the turn marker where the configuration has none', () => {
    const plain: CombatTrackerConfig = { resource: null, skipDefeated: false };

    expect(applyTrackerConfigChanges(plain, { skipDefeated: true, turnMarker: { enabled: false } })).toEqual({
      resource: null,
      skipDefeated: true
    });
  });
});
