import { ActorNotFoundError, TokenHasNoActorError } from '../../../shared';
import {
  RollFormulaRequiredError,
  TooManyDiceError,
  TooManySimulatedDiceError,
  UNEVALUABLE_FORMULA,
  UnresolvedRollDataError
} from '../../domain';
import { DiceService } from '../DiceService';
import type { RollDiceCommand } from '../commands';
import { FakeDiceRoller } from './fakePorts';
import { FakeActorLocator, FakeChatSpeakers, FakeRollFormulas, FakeScenes, RecordingDiceRoller } from './fakeWorldPorts';

interface Setup {
  service: DiceService;
  dice: RecordingDiceRoller;
  formulas: FakeRollFormulas;
  speakers: FakeChatSpeakers;
}

function setup(): Setup {
  const dice = new RecordingDiceRoller();
  const formulas = new FakeRollFormulas();
  const speakers = new FakeChatSpeakers();
  const service = new DiceService({
    dice,
    formulas,
    speakers,
    scenes: new FakeScenes(),
    locator: new FakeActorLocator()
  });
  return { service, dice, formulas, speakers };
}

function roll(overrides: Partial<RollDiceCommand> = {}): RollDiceCommand {
  return { formula: '1d20 + @prof', showInChat: false, flavor: undefined, ...overrides };
}

const goblin = { kind: 'actor', actorId: 'a1' } as const;
const scout = { kind: 'token', tokenId: 't1', sceneId: undefined } as const;

describe('DiceService.roll options', () => {
  it('rolls without roll data when no actor or data is given', async () => {
    const { service, dice } = setup();

    await service.roll(roll());

    expect(dice.prepared).toEqual([{ formula: '1d20 + @prof', data: undefined }]);
  });

  it('feeds the actor roll data and the caller data to the roll', async () => {
    const { service, dice } = setup();

    await service.roll(roll({ roller: goblin, data: { bonus: 2 } }));

    expect(dice.prepared[0]?.data).toEqual({ actor: { kind: 'world', actorId: 'a1' }, values: { bonus: 2 } });
  });

  it('reaches a token actor on the active scene', async () => {
    const { service, dice } = setup();

    await service.roll(roll({ roller: scout }));

    expect(dice.prepared[0]?.data).toEqual({ actor: { kind: 'token', sceneId: 's1', tokenId: 't1' }, values: undefined });
  });

  it('refuses references the roll data does not set, before anything is rolled', async () => {
    const { service, dice, formulas } = setup();
    formulas.unresolved = ['@prof', '@missing'];

    await expect(service.roll(roll({ data: { bonus: 1 } }))).rejects.toThrow(UnresolvedRollDataError);
    await expect(service.roll(roll({ roller: goblin }))).rejects.toThrow(
      'Roll formula references data that is not set: @prof, @missing'
    );
    expect(dice.prepared).toEqual([]);
  });

  it('leaves unset references to the core when there is no roll data at all', async () => {
    const { service, dice, formulas } = setup();
    formulas.unresolved = ['@prof'];

    await service.roll(roll());

    expect(dice.prepared).toHaveLength(1);
  });

  it('fails on an unknown actor and on a token without one', async () => {
    const { service } = setup();

    await expect(service.roll(roll({ roller: { kind: 'actor', actorId: 'nope' } }))).rejects.toThrow(ActorNotFoundError);
    await expect(service.roll(roll({ roller: { kind: 'token', tokenId: 'statue', sceneId: 's1' } }))).rejects.toThrow(
      TokenHasNoActorError
    );
  });

  it('still checks the formula before it looks up the actor', async () => {
    const { service } = setup();

    await expect(service.roll(roll({ formula: ' ', roller: { kind: 'actor', actorId: 'nope' } }))).rejects.toThrow(
      RollFormulaRequiredError
    );
  });

  describe('posting', () => {
    it('posts a plain roll without options', async () => {
      const { service, dice, speakers } = setup();

      await service.roll(roll({ showInChat: true, flavor: 'Attack' }));

      expect(dice.posts).toEqual([{ flavor: 'Attack', options: undefined }]);
      expect(speakers.requests).toEqual([]);
    });

    it('posts for the actor under the alias, with the visibility', async () => {
      const { service, dice, speakers } = setup();

      await service.roll(roll({ showInChat: true, roller: goblin, alias: 'Grik', visibility: 'blind' }));

      expect(speakers.requests).toEqual([{ subject: { kind: 'world', actorId: 'a1' }, alias: 'Grik' }]);
      expect(dice.posts[0]?.options).toEqual({
        speaker: { alias: 'Grik', actorId: 'a1', tokenId: null, sceneId: 's1' },
        visibility: 'blind'
      });
    });

    it('posts for the token it reached the actor through', async () => {
      const { service, speakers } = setup();

      await service.roll(roll({ showInChat: true, roller: scout }));

      expect(speakers.requests[0]?.subject).toEqual({ kind: 'token', sceneId: 's1', tokenId: 't1' });
    });

    it('posts under an alias alone, naming no actor or token', async () => {
      const { service, dice } = setup();

      await service.roll(roll({ showInChat: true, alias: 'Narrator' }));

      expect(dice.posts[0]?.options).toEqual({
        speaker: { alias: 'Narrator', actorId: null, tokenId: null, sceneId: 's1' },
        visibility: undefined
      });
    });

    it('posts with only a visibility', async () => {
      const { service, dice } = setup();

      await service.roll(roll({ showInChat: true, visibility: 'self' }));

      expect(dice.posts[0]?.options).toEqual({ speaker: undefined, visibility: 'self' });
    });

    it('builds no speaker for a roll that is not posted', async () => {
      const { service, speakers } = setup();

      await service.roll(roll({ roller: goblin, alias: 'Grik', visibility: 'gm' }));

      expect(speakers.requests).toEqual([]);
    });
  });
});

describe('DiceService.validate', () => {
  it('reports a valid formula and the references the roll data leaves unset', () => {
    const { service, formulas } = setup();
    formulas.unresolved = ['@missing'];

    expect(service.validate({ formula: ' 1d20 + @prof + @missing ', roller: goblin })).toEqual({
      formula: '1d20 + @prof + @missing',
      valid: true,
      reason: null,
      unresolvedReferences: ['@missing']
    });
    expect(formulas.validated).toEqual([
      { formula: '1d20 + @prof + @missing', data: { actor: { kind: 'world', actorId: 'a1' }, values: undefined } }
    ]);
  });

  it('reports a formula the core turns down, with the module reason', () => {
    const { service, formulas, dice } = setup();
    formulas.valid = false;

    expect(service.validate({ formula: '1d20 +' })).toMatchObject({ valid: false, reason: UNEVALUABLE_FORMULA });
    expect(dice.prepared).toEqual([]);
  });

  it('reports too many dice without rolling', () => {
    const { service, dice } = setup();
    dice.diceCounts = [600, 401];

    expect(service.validate({ formula: '600d20 + 401d6' })).toMatchObject({
      valid: false,
      reason: new TooManyDiceError(1001, 1000).message
    });
  });

  it('reports a formula over the length limit as invalid', () => {
    const { service, formulas } = setup();

    expect(service.validate({ formula: `${'1d6+'.repeat(60)}1` })).toEqual({
      formula: `${'1d6+'.repeat(60)}1`,
      valid: false,
      reason: 'Roll formula is too long (241 > 200 characters)',
      unresolvedReferences: []
    });
    expect(formulas.validated).toEqual([]);
  });

  it('refuses an empty formula', () => {
    expect(() => setup().service.validate({ formula: '  ' })).toThrow(RollFormulaRequiredError);
  });

  it('fails on an unknown actor', () => {
    expect(() => setup().service.validate({ formula: '1d20', roller: { kind: 'actor', actorId: 'nope' } })).toThrow(
      'Actor not found: nope'
    );
  });
});

describe('DiceService.simulate', () => {
  it('simulates the formula with the roll data and summarizes the totals', async () => {
    const { service, formulas } = setup();

    await expect(service.simulate({ formula: '1d6 + @prof', iterations: 3, roller: goblin, data: { x: 1 } })).resolves.toEqual({
      formula: '1d6 + @prof',
      iterations: 3,
      totals: [3, 5, 7],
      min: 3,
      max: 7,
      mean: 5
    });
    expect(formulas.simulated).toEqual([
      { formula: '1d6 + @prof', data: { actor: { kind: 'world', actorId: 'a1' }, values: { x: 1 } }, iterations: 3 }
    ]);
  });

  it('refuses unset references even without roll data', async () => {
    const { service, formulas } = setup();
    formulas.unresolved = ['@prof'];

    await expect(service.simulate({ formula: '1d6 + @prof', iterations: 3 })).rejects.toThrow(
      'Roll formula references data that is not set: @prof'
    );
    expect(formulas.simulated).toEqual([]);
  });

  it('refuses a simulation over the dice budget, and a single roll over the dice limit', async () => {
    const { service, dice, formulas } = setup();
    dice.diceCounts = [200];

    await expect(service.simulate({ formula: '200d6', iterations: 1000 })).rejects.toThrow(TooManySimulatedDiceError);
    dice.diceCounts = [1001];
    await expect(service.simulate({ formula: '1001d6', iterations: 1 })).rejects.toThrow(TooManyDiceError);
    expect(formulas.simulated).toEqual([]);
  });
});

it('names the port a dice service composed for plain rolls lacks', async () => {
  const service = new DiceService({ dice: new FakeDiceRoller() });

  await expect(service.roll(roll({ data: { bonus: 1 } }))).rejects.toThrow(
    'The chat context was composed without its formulas port'
  );
  await expect(service.roll(roll({ roller: goblin }))).rejects.toThrow(
    'The chat context was composed without its scenes port'
  );
});
