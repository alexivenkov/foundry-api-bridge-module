import { SwadeActionCardsGateway } from '../SwadeActionCardsGateway';
import { makeCombat, makeCombatant, makeGame } from '@/systems/swade/shared/__tests__/swadeTestFixtures';

describe('SwadeActionCardsGateway', () => {
  it('maps the action cards of the active combat', async () => {
    const combat = makeCombat({
      combatants: {
        contents: [
          makeCombatant(),
          makeCombatant({
            id: 'c2',
            name: 'Joker',
            actorId: null,
            tokenId: null,
            initiative: 53.5,
            isGroupLeader: true,
            roundHeld: 2,
            turnLost: true,
            isDefeated: true,
            system: { cardValue: 53, suitValue: 5, cardString: 'Red Joker', hasJoker: true }
          }),
          makeCombatant({ id: 'c3', name: 'Waiting', initiative: null, system: { cardValue: null, suitValue: null, cardString: '', hasJoker: false } })
        ]
      }
    });
    const outcome = await new SwadeActionCardsGateway(makeGame({ combat })).getActionCards(undefined);

    expect(outcome).toEqual({
      combatId: 'combat-1',
      round: 2,
      turn: 0,
      combatants: [
        {
          combatantId: 'c1',
          name: 'Hero',
          actorId: 'a1',
          tokenId: 't1',
          initiative: 12.4,
          cardValue: 12,
          suitValue: 4,
          cardString: 'Queen of Spades',
          hasJoker: false,
          roundHeld: null,
          turnLost: false,
          isGroupLeader: false,
          isDefeated: false
        },
        {
          combatantId: 'c2',
          name: 'Joker',
          actorId: null,
          tokenId: null,
          initiative: 53.5,
          cardValue: 53,
          suitValue: 5,
          cardString: 'Red Joker',
          hasJoker: true,
          roundHeld: 2,
          turnLost: true,
          isGroupLeader: true,
          isDefeated: true
        },
        {
          combatantId: 'c3',
          name: 'Waiting',
          actorId: 'a1',
          tokenId: 't1',
          initiative: null,
          cardValue: null,
          suitValue: null,
          cardString: null,
          hasJoker: false,
          roundHeld: null,
          turnLost: false,
          isGroupLeader: false,
          isDefeated: false
        }
      ]
    });
  });

  it('falls back to the combatant data model and the defeated flag when the getters are absent', async () => {
    const bare = { id: 'c9', name: 'Bare', actorId: 'a9', tokenId: null, initiative: 7.1, defeated: true, system: { cardValue: 7, suitValue: 1, roundHeld: 3, turnLost: true } };
    const combat = makeCombat({ turn: null, combatants: { contents: [bare] } });
    const outcome = await new SwadeActionCardsGateway(makeGame({ combat })).getActionCards(undefined);
    expect(outcome.turn).toBe(0);
    expect(outcome.combatants[0]).toMatchObject({ roundHeld: 3, turnLost: true, isDefeated: true, isGroupLeader: false, cardString: null });
  });

  it('resolves a combat by id and fails clearly otherwise', async () => {
    const other = makeCombat({ id: 'combat-2', round: 5 });
    const gateway = new SwadeActionCardsGateway(makeGame({ combats: [other] }));

    expect((await gateway.getActionCards('combat-2')).round).toBe(5);
    await expect(gateway.getActionCards('zz')).rejects.toThrow('Combat not found: zz');
    await expect(gateway.getActionCards(undefined)).rejects.toThrow('No active combat');
  });
});
