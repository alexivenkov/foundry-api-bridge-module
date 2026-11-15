import type {
  ActorIdentity,
  ActorLocator,
  ActorRef,
  SceneIdentity,
  SceneLocator,
  TargetToken
} from '../../../shared';
import type {
  ChatSpeakers,
  ChatUserDirectory,
  DiceRoll,
  DiceRoller,
  PreparedRoll,
  ResolvedChatSpeaker,
  RollDataSpec,
  RollFormulaInspector,
  RollPostOptions
} from '../../domain';

export class FakeScenes implements SceneLocator {
  constructor(
    private readonly scenes: readonly SceneIdentity[] = [{ id: 's1', name: 'Cave' }],
    private readonly activeId: string | null = 's1'
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return this.scenes.find((scene) => scene.id === sceneId) ?? null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId !== null ? this.findScene(this.activeId) : null;
  }
}

export class FakeActorLocator implements ActorLocator {
  constructor(
    private readonly actors: readonly ActorIdentity[] = [{ id: 'a1', name: 'Goblin' }],
    /** Tokens per scene id. */
    private readonly tokens: Readonly<Record<string, readonly TargetToken[]>> = {
      s1: [
        { id: 't1', actor: { id: 'a1', name: 'Goblin Scout' } },
        { id: 'statue', actor: null }
      ]
    }
  ) {}

  findWorldActor(actorId: string): ActorIdentity | null {
    return this.actors.find((actor) => actor.id === actorId) ?? null;
  }

  findToken(sceneId: string, tokenId: string): TargetToken | null {
    return this.tokens[sceneId]?.find((token) => token.id === tokenId) ?? null;
  }
}

/** Ids and the names the core's /whisper resolves, each to the ids it stands for. */
export class FakeChatUsers implements ChatUserDirectory {
  constructor(
    private readonly ids: readonly string[] = ['gm', 'u1', 'u2'],
    private readonly names: Readonly<Record<string, readonly string[]>> = {
      alice: ['u1'],
      players: ['u1', 'u2'],
      gm: ['gm']
    }
  ) {}

  hasUser(userId: string): boolean {
    return this.ids.includes(userId);
  }

  findRecipients(name: string): readonly string[] {
    return this.names[name.toLowerCase()] ?? [];
  }
}

export class FakeChatSpeakers implements ChatSpeakers {
  readonly requests: Array<{ subject: ActorRef | 'standalone'; alias: string | undefined }> = [];

  speakerFor(subject: ActorRef, alias: string | undefined): ResolvedChatSpeaker {
    this.requests.push({ subject, alias });
    return subject.kind === 'token'
      ? { alias: alias ?? 'Token Name', actorId: 'a1', tokenId: subject.tokenId, sceneId: subject.sceneId }
      : { alias: alias ?? 'Actor Name', actorId: subject.actorId, tokenId: null, sceneId: 's1' };
  }

  standaloneSpeaker(alias: string): ResolvedChatSpeaker {
    this.requests.push({ subject: 'standalone', alias });
    return { alias, actorId: null, tokenId: null, sceneId: 's1' };
  }
}

/** A roller that records the roll data each formula was prepared with and how each roll was posted. */
export class RecordingDiceRoller implements DiceRoller {
  readonly prepared: Array<{ formula: string; data: RollDataSpec | undefined }> = [];
  readonly posts: Array<{ flavor: string | null | undefined; options: RollPostOptions | undefined }> = [];
  diceCounts: readonly (number | null)[] = [1];
  outcome: DiceRoll = { formula: '1d20 + 2', total: 13, dice: [{ faces: 20, count: 1, results: [{ value: 11, kept: true }] }] };

  prepare(formula: string, data?: RollDataSpec): PreparedRoll {
    this.prepared.push({ formula, data });
    return {
      diceCounts: this.diceCounts,
      roll: () => Promise.resolve(this.outcome),
      post: (flavor, options) => {
        this.posts.push({ flavor, options });
        return Promise.resolve();
      }
    };
  }
}

export class FakeRollFormulas implements RollFormulaInspector {
  valid = true;
  unresolved: readonly string[] = [];
  totals: readonly number[] = [3, 5, 7];
  readonly simulated: Array<{ formula: string; data: RollDataSpec | undefined; iterations: number }> = [];
  readonly validated: Array<{ formula: string; data: RollDataSpec | undefined }> = [];

  isValid(formula: string, data: RollDataSpec | undefined): boolean {
    this.validated.push({ formula, data });
    return this.valid;
  }

  findUnresolvedReferences(): readonly string[] {
    return this.unresolved;
  }

  simulate(formula: string, data: RollDataSpec | undefined, iterations: number): Promise<readonly number[]> {
    this.simulated.push({ formula, data, iterations });
    return Promise.resolve(this.totals);
  }
}
