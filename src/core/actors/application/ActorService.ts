import { refuseNewScriptCarriers } from '@/kernel';
import {
  ActorNotFoundError,
  requireActor,
  targetTokenId,
  type ActorLocator,
  type SceneLocator
} from '@/core/shared';
import {
  ActorCreationCancelledError,
  type Actor,
  type ActorDetails,
  type ActorSources,
  type ActorStore,
  type ActorSummary,
  type ScriptCarrierPolicy
} from '@/core/actors/domain';
import type {
  CreateActorCommand,
  DeleteActorCommand,
  GetActorQuery,
  UpdateActorCommand
} from './commands';

export interface ActorServiceDependencies {
  readonly scenes: SceneLocator;
  readonly locator: ActorLocator;
  readonly actors: ActorStore;
  /** Absent: actor data that automation modules run is refused. */
  readonly scripts?: ScriptCarrierPolicy | undefined;
  /** Absent: a carrier sent again unchanged counts as new. */
  readonly sources?: ActorSources | undefined;
}

const NO_SCRIPTS: ScriptCarrierPolicy = { allowsScripts: () => false };

export interface ActorUpdateResult {
  readonly actor: Actor;
  /** The token the actor was addressed through, when it was. */
  readonly tokenId: string | undefined;
}

export class ActorService {
  constructor(private readonly deps: ActorServiceDependencies) {}

  listActors(): readonly ActorSummary[] {
    return this.deps.actors.listActors();
  }

  getActor(query: GetActorQuery): ActorDetails {
    const actor = this.deps.actors.findActorDetails(query.actorId);
    if (actor === null) {
      throw new ActorNotFoundError(query.actorId);
    }
    return actor;
  }

  async createActor(command: CreateActorCommand): Promise<Actor> {
    refuseNewScriptCarriers('Actor', command.draft, () => this.allowsScripts());
    const actor = await this.deps.actors.createActor(command.draft);
    if (actor === null) {
      throw new ActorCreationCancelledError();
    }
    return actor;
  }

  /** Updates a world actor, or one token's own actor: an unlinked token keeps its changes to itself. */
  async updateActor(command: UpdateActorCommand): Promise<ActorUpdateResult> {
    const located = requireActor(this.deps.scenes, this.deps.locator, command.target);
    refuseNewScriptCarriers('Actor', command.changes, () => this.allowsScripts(), () => ({
      system: this.deps.sources?.storedSystem(located.ref) ?? {}
    }));
    const actor = await this.deps.actors.updateActor(located.ref, command.changes);
    return { actor, tokenId: targetTokenId(located) };
  }

  async deleteActor(command: DeleteActorCommand): Promise<void> {
    if (this.deps.locator.findWorldActor(command.actorId) === null) {
      throw new ActorNotFoundError(command.actorId);
    }
    await this.deps.actors.deleteActor(command.actorId);
  }

  private allowsScripts(): boolean {
    return (this.deps.scripts ?? NO_SCRIPTS).allowsScripts();
  }
}
