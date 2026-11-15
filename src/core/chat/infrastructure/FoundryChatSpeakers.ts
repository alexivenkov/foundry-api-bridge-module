import {
  ActorNotFoundError,
  SceneNotFoundError,
  TargetTokenNotFoundError,
  findFoundryScene,
  type ActorRef
} from '@/core/shared';
import type { ChatSpeakers, ResolvedChatSpeaker } from '@/core/chat/domain';
import { toResolvedSpeaker } from './chatMessageMapper';
import type { ChatSpeakerGlobalsProvider, FoundryChatSpeakerOptions } from './foundryChatTypes';

/** Speakers built by the core's `ChatMessage.getSpeaker` from the documents themselves. */
export class FoundryChatSpeakers implements ChatSpeakers {
  constructor(private readonly globals: ChatSpeakerGlobalsProvider) {}

  speakerFor(subject: ActorRef, alias: string | undefined): ResolvedChatSpeaker {
    const { ChatMessage } = this.globals();
    const options: FoundryChatSpeakerOptions =
      subject.kind === 'token' ? { token: this.requireToken(subject.sceneId, subject.tokenId) } : { actor: this.requireActor(subject.actorId) };
    if (alias !== undefined) {
      options.alias = alias;
    }
    return toResolvedSpeaker(ChatMessage.getSpeaker(options));
  }

  /** The core's speaker for the current user, stripped of the token and actor it may have picked up. */
  standaloneSpeaker(alias: string): ResolvedChatSpeaker {
    const { scene } = this.globals().ChatMessage.getSpeaker();
    return { alias, actorId: null, tokenId: null, sceneId: scene ?? null };
  }

  private requireActor(actorId: string): object {
    const actor = this.globals().game.actors.get(actorId);
    if (actor === undefined) {
      throw new ActorNotFoundError(actorId);
    }
    return actor;
  }

  private requireToken(sceneId: string, tokenId: string): object {
    const scene = findFoundryScene(this.globals().game.scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    const token = scene.tokens.get(tokenId);
    if (token === undefined) {
      throw new TargetTokenNotFoundError(tokenId);
    }
    return token;
  }
}
