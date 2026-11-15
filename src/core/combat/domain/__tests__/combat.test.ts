import { DomainError } from '../../../../kernel';
import {
  CombatAlreadyStartedError,
  CombatCreationCancelledError,
  CombatNotFoundError,
  CombatNotStartedError,
  CombatantCreationFailedError,
  CombatantLostError,
  CombatantNotFoundError,
  CombatantNotInTurnOrderError,
  CurrentCombatantHasNoTokenError,
  CurrentCombatantTokenNotFoundError,
  NoActiveCombatError,
  NoBattlefieldError,
  NoCombatantIdsError,
  NoCurrentCombatantError,
  hasCombatantChanges,
  initiativeScoreOf,
  participantTokenIds,
  rolledInitiativeScores,
  turnOf
} from '..';
import { combat, combatant } from './fixtures';

describe('combatant changes', () => {
  it('has none when no attribute is named', () => {
    expect(hasCombatantChanges({})).toBe(false);
    expect(hasCombatantChanges({ initiative: undefined, defeated: undefined, hidden: undefined })).toBe(false);
  });

  it.each([
    ['an initiative', { initiative: 12 }],
    ['an initiative of zero', { initiative: 0 }],
    ['a cleared initiative', { initiative: null }],
    ['a defeated flag that is off', { defeated: false }],
    ['a hidden flag', { hidden: true }]
  ])('counts %s as a change', (_case, changes) => {
    expect(hasCombatantChanges(changes)).toBe(true);
  });
});

describe('turn order', () => {
  const fight = combat({
    turnOrder: [combatant({ id: 'wizard' }), combatant({ id: 'goblin' }), combatant({ id: 'fighter' })]
  });

  it('gives the position of a combatant', () => {
    expect(turnOf(fight, 'wizard')).toBe(0);
    expect(turnOf(fight, 'fighter')).toBe(2);
  });

  it('gives null for a combatant that is not part of it', () => {
    expect(turnOf(fight, 'bystander')).toBeNull();
    expect(turnOf(combat({ turnOrder: [] }), 'wizard')).toBeNull();
  });
});

describe('participant tokens', () => {
  it('collects the tokens of the combatants, leaving out those without one', () => {
    const ids = participantTokenIds([
      combatant({ id: 'c1', tokenId: 't1' }),
      combatant({ id: 'c2', tokenId: null }),
      combatant({ id: 'c3', tokenId: '' }),
      combatant({ id: 'c4', tokenId: 't4' })
    ]);

    expect([...ids]).toEqual(['t1', 't4']);
  });

  it('is empty for an encounter without combatants', () => {
    expect(participantTokenIds([]).size).toBe(0);
  });
});

describe('initiative scores', () => {
  it('reports a combatant with its name and initiative', () => {
    expect(initiativeScoreOf('c1', combatant({ name: 'Wizard', initiative: 12 }))).toEqual({
      combatantId: 'c1',
      name: 'Wizard',
      initiative: 12
    });
  });

  it('reports 0 for a combatant that has not rolled', () => {
    expect(initiativeScoreOf('c1', combatant({ initiative: null })).initiative).toBe(0);
  });

  it('reports a combatant that is gone as unknown, under the id that was asked for', () => {
    expect(initiativeScoreOf('gone', null)).toEqual({ combatantId: 'gone', name: 'Unknown', initiative: 0 });
  });

  describe('of a roll for the combatants without initiative', () => {
    const fighter = combatant({ id: 'c1', name: 'Fighter', initiative: null });
    const wizard = combatant({ id: 'c2', name: 'Wizard', initiative: null });
    const goblin = combatant({ id: 'c3', name: 'Goblin', initiative: 12 });

    it('lists the combatants that had no initiative and have one now, in their order after the roll', () => {
      const after = [{ ...wizard, initiative: 0 }, goblin, { ...fighter, initiative: 15 }];

      expect(rolledInitiativeScores([fighter, wizard, goblin], after)).toEqual([
        { combatantId: 'c2', name: 'Wizard', initiative: 0 },
        { combatantId: 'c1', name: 'Fighter', initiative: 15 }
      ]);
    });

    it('leaves out a combatant that had already rolled, whatever its initiative is now', () => {
      const after = [fighter, wizard, { ...goblin, initiative: 19 }];

      expect(rolledInitiativeScores([fighter, wizard, goblin], after)).toEqual([]);
    });

    it('leaves out a combatant the roll did not reach', () => {
      const after = [{ ...fighter, initiative: 7 }, wizard, goblin];

      expect(rolledInitiativeScores([fighter, wizard, goblin], after).map((score) => score.combatantId)).toEqual([
        'c1'
      ]);
    });

    it('leaves out a combatant that joined during the roll', () => {
      const latecomer = combatant({ id: 'c9', name: 'Ogre', initiative: 4 });

      expect(rolledInitiativeScores([goblin], [goblin, latecomer])).toEqual([]);
    });

    it('is empty when no one was without initiative', () => {
      expect(rolledInitiativeScores([goblin], [goblin])).toEqual([]);
      expect(rolledInitiativeScores([], [])).toEqual([]);
    });
  });
});

describe('combat errors', () => {
  it.each([
    [new CombatNotFoundError('fight'), 'Combat not found: fight'],
    [new NoActiveCombatError(), 'No active combat'],
    [
      new CombatCreationCancelledError(),
      'Combat creation was cancelled by Foundry (a module hook may have vetoed it)'
    ],
    [new CombatAlreadyStartedError(), 'Combat already started'],
    [new CombatNotStartedError(), 'Combat not started'],
    [new CombatantNotFoundError('c9'), 'Combatant not found: c9'],
    [new CombatantNotInTurnOrderError('c9'), 'Combatant not found in turn order: c9'],
    [new CombatantCreationFailedError(), 'Failed to create combatant'],
    [new CombatantLostError(), 'Failed to get updated combatant'],
    [new NoCombatantIdsError(), 'No combatant IDs provided'],
    [new NoCurrentCombatantError(), 'No current combatant'],
    [new CurrentCombatantHasNoTokenError(), 'Current combatant has no token'],
    [new NoBattlefieldError(), 'No active scene'],
    [new CurrentCombatantTokenNotFoundError('t9'), 'Token not found for current combatant: t9']
  ])('%s carries its wire text', (error, text) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe(text);
    expect(error.name).toBe(error.constructor.name);
  });
});
