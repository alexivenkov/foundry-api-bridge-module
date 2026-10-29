import { completeTraitRoll, callerModifier } from '../traitRollRunner';
import { makeActor, makeGame, makeTraitRoll } from '../../__tests__/swadeTestFixtures';

describe('completeTraitRoll', () => {
  const actor = makeActor();
  const game = makeGame({ actors: [actor] });
  const context = { actor, tokenId: undefined, trait: 'vigor', targetNumber: 6, showInChat: false, flavor: 'Vigor Attribute Test' };

  it('rejects a roll the system cancelled', async () => {
    await expect(completeTraitRoll(game, null, context)).rejects.toThrow('Roll was cancelled by a module hook');
  });

  it('sets the target number, evaluates without interaction and maps the roll', async () => {
    const roll = makeTraitRoll({ dice: [{ faces: 8, results: [7] }] });

    const outcome = await completeTraitRoll(game, roll, context);

    expect(roll.targetNumber).toBe(6);
    expect(roll.evaluate).toHaveBeenCalledWith({ allowInteractive: false });
    expect(roll.toMessage).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ actorId: 'a1', trait: 'vigor', total: 7, targetNumber: 6, successes: 1 });
    expect(outcome.messageId).toBeUndefined();
  });

  it('posts the chat card with the flavor and returns the message id when asked', async () => {
    const roll = makeTraitRoll({ messageId: 'chat-42' });
    (globalThis as Record<string, unknown>)['ChatMessage'] = { getSpeaker: () => ({ alias: 'Hero' }) };

    const outcome = await completeTraitRoll(game, roll, { ...context, showInChat: true, tokenId: 't1' });

    expect(roll.toMessage).toHaveBeenCalledWith({ flavor: 'Vigor Attribute Test', speaker: { alias: 'Hero' } });
    expect(outcome.messageId).toBe('chat-42');
    expect(outcome.tokenId).toBe('t1');
    delete (globalThis as Record<string, unknown>)['ChatMessage'];
  });
});

describe('callerModifier', () => {
  it('skips empty modifiers and labels the rest', () => {
    expect(callerModifier(undefined, undefined)).toBeUndefined();
    expect(callerModifier(0, 'x')).toBeUndefined();
    expect(callerModifier('', 'x')).toBeUndefined();
    expect(callerModifier(2, undefined)).toEqual({ label: 'Modifier', value: 2 });
    expect(callerModifier('+1d4', 'Flank')).toEqual({ label: 'Flank', value: '+1d4' });
  });
});
