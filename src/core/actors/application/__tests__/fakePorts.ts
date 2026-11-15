import type {
  ActorIdentity,
  ActorLocator,
  ActorRef,
  SceneIdentity,
  SceneLocator,
  TargetToken
} from '../../../shared';
import type { Actor, ActorChanges, ActorDetails, ActorDraft, ActorStore, ActorSummary } from '../../domain';

export function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: 'a1',
    uuid: 'Actor.a1',
    name: 'Goblin',
    type: 'npc',
    img: 'goblin.webp',
    folderName: null,
    ...overrides
  };
}

/** A world with one scene, `cave`, holding the tokens given; it is the active scene unless told otherwise. */
export class FakeWorld implements SceneLocator, ActorLocator {
  activeSceneId: string | null = 'cave';

  constructor(
    private readonly worldActors: readonly ActorIdentity[],
    private readonly caveTokens: Readonly<Record<string, ActorIdentity | null>> = {}
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return sceneId === 'cave' ? { id: 'cave', name: 'Cave' } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeSceneId !== null ? this.findScene(this.activeSceneId) : null;
  }

  findWorldActor(actorId: string): ActorIdentity | null {
    return this.worldActors.find((candidate) => candidate.id === actorId) ?? null;
  }

  findToken(sceneId: string, tokenId: string): TargetToken | null {
    if (sceneId !== 'cave' || !(tokenId in this.caveTokens)) {
      return null;
    }
    return { id: tokenId, actor: this.caveTokens[tokenId] ?? null };
  }
}

export class FakeActorStore implements ActorStore {
  readonly created: ActorDraft[] = [];
  readonly updated: Array<{ ref: ActorRef; changes: ActorChanges }> = [];
  readonly deleted: string[] = [];
  createsNothing = false;

  constructor(private readonly details: readonly ActorDetails[] = []) {}

  listActors(): readonly ActorSummary[] {
    return this.details.map(({ id, name, type, img }) => ({ id, name, type, img }));
  }

  findActorDetails(actorId: string): ActorDetails | null {
    return this.details.find((candidate) => candidate.id === actorId) ?? null;
  }

  createActor(draft: ActorDraft): Promise<Actor | null> {
    this.created.push(draft);
    return Promise.resolve(this.createsNothing ? null : actor({ id: 'created', name: draft.name, type: draft.type }));
  }

  updateActor(ref: ActorRef, changes: ActorChanges): Promise<Actor> {
    this.updated.push({ ref, changes });
    return Promise.resolve(actor(changes.name !== undefined ? { name: changes.name } : {}));
  }

  deleteActor(actorId: string): Promise<void> {
    this.deleted.push(actorId);
    return Promise.resolve();
  }
}
