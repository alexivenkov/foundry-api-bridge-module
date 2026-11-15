import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type {
  ActorTokenIndex,
  ActorTokenPlacement,
  PrototypeToken,
  PrototypeTokenChanges,
  PrototypeTokenStore,
  Token,
  TokenDraft
} from '@/core/tokens/domain';
import type { AppearanceWriteOptions, FoundryPrototypeTokenSource } from './foundryTokenAppearanceTypes';
import type { FoundryTokenDocument } from './foundryTokenTypes';
import { DISPLAY_MODE_CODE, DISPOSITION_CODE } from './tokenAppearanceCodes';
import { toFoundryAppearanceData, toFoundryTextureData, toPrototypeToken } from './tokenAppearanceMapper';
import { textureScale, toFoundryTokenCreateData, toToken } from './tokenMapper';
import { appearanceWriteOptions } from './writeOptions';

/** An unsaved token built by `Actor#getTokenDocument`. */
export interface FoundryUnsavedTokenDocument {
  updateSource(changes: Record<string, unknown>): unknown;
}

export interface FoundryPrototypeActor {
  id: string;
  _source: { prototypeToken: FoundryPrototypeTokenSource };
  update(data: Record<string, unknown>): Promise<unknown>;
  getTokenImages(): Promise<string[]>;
  getTokenDocument(data: Record<string, unknown>, options: { parent: unknown }): Promise<FoundryUnsavedTokenDocument>;
}

export interface FoundryPlacedToken {
  id: string;
  name: string;
  x: number;
  y: number;
  elevation: number;
  hidden: boolean;
  actorId?: string | null;
  actorLink?: boolean;
}

export interface FoundryPrototypeScene {
  id: string;
  name?: string;
  active?: boolean;
  tokens: { contents: FoundryPlacedToken[] };
  createEmbeddedDocuments(type: 'Token', data: unknown[]): Promise<FoundryTokenDocument[]>;
}

export interface FoundryPrototypeGame {
  actors: { get(id: string): FoundryPrototypeActor | undefined };
  scenes: {
    get(id: string): FoundryPrototypeScene | undefined;
    active: FoundryPrototypeScene | null | undefined;
    contents: FoundryPrototypeScene[];
  };
}

export type PrototypeGameProvider = GameProvider<FoundryPrototypeGame>;

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

function toFoundryPrototypeData(changes: PrototypeTokenChanges, options: AppearanceWriteOptions): Record<string, unknown> {
  const data = toFoundryAppearanceData(changes, options);
  setIfDefined(data, 'texture', toFoundryTextureData(changes.texture));
  for (const field of ['name', 'actorLink', 'randomImg', 'appendNumber', 'prependAdjective', 'rotation', 'lockRotation'] as const) {
    setIfDefined(data, field, changes[field]);
  }
  if (changes.disposition !== undefined) {
    data['disposition'] = DISPOSITION_CODE[changes.disposition];
  }
  if (changes.nameDisplay !== undefined) {
    data['displayName'] = DISPLAY_MODE_CODE[changes.nameDisplay];
  }
  return data;
}

/**
 * World actors' prototype tokens (`Actor#prototypeToken`, read from the stored
 * data), their wildcard images, and tokens placed from them the way the core's
 * actor drop does it (`Actor#getTokenDocument`, then a create with the scene
 * as parent).
 */
export class FoundryPrototypeTokens implements PrototypeTokenStore, ActorTokenIndex {
  constructor(
    private readonly gameProvider: PrototypeGameProvider,
    private readonly writeOptions: () => AppearanceWriteOptions = appearanceWriteOptions
  ) {}

  findPrototype(actorId: string): PrototypeToken | null {
    const actor = this.gameProvider.getGame().actors.get(actorId);
    return actor ? toPrototypeToken(actor.id, actor._source.prototypeToken) : null;
  }

  async updatePrototype(actorId: string, changes: PrototypeTokenChanges): Promise<PrototypeToken | null> {
    const actor = this.gameProvider.getGame().actors.get(actorId);
    if (!actor) {
      return null;
    }
    await actor.update({ prototypeToken: toFoundryPrototypeData(changes, this.writeOptions()) });
    return toPrototypeToken(actor.id, actor._source.prototypeToken);
  }

  async tokenImages(actorId: string): Promise<readonly string[]> {
    const actor = this.gameProvider.getGame().actors.get(actorId);
    return actor ? [...(await actor.getTokenImages())] : [];
  }

  /**
   * The prototype's detection modes are replaced, not merged, by a list the
   * draft brings: `getTokenDocument` deep-merges its data into the prototype,
   * so the list is applied to the unsaved token afterwards.
   */
  async createFromPrototype(sceneId: string, draft: TokenDraft): Promise<Token | null> {
    const game = this.gameProvider.getGame();
    const scene = findFoundryScene(game.scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    const actor = game.actors.get(draft.actorId);
    if (!actor) {
      return null;
    }
    const options = this.writeOptions();
    const { detectionModes, ...data } = toFoundryTokenCreateData({ ...draft, scale: undefined }, options);
    if (draft.scale !== undefined) {
      data['texture'] = {
        ...(data['texture'] as Record<string, unknown> | undefined),
        ...textureScale(draft.scale, actor._source.prototypeToken.texture)
      };
    }
    const unsaved = await actor.getTokenDocument(data, { parent: scene });
    if (detectionModes !== undefined) {
      unsaved.updateSource({ detectionModes });
    }
    const created = await scene.createEmbeddedDocuments('Token', [unsaved]);
    const document = created[0];
    return document !== undefined ? toToken(document) : null;
  }

  listActorTokens(actorId: string): readonly ActorTokenPlacement[] {
    const placements: ActorTokenPlacement[] = [];
    for (const scene of this.gameProvider.getGame().scenes.contents) {
      for (const token of scene.tokens.contents) {
        if (token.actorId !== actorId) {
          continue;
        }
        placements.push({
          sceneId: scene.id,
          sceneName: scene.name ?? '',
          sceneActive: scene.active === true,
          tokenId: token.id,
          name: token.name,
          x: token.x,
          y: token.y,
          elevation: token.elevation,
          hidden: token.hidden,
          actorLink: token.actorLink ?? false
        });
      }
    }
    return placements;
  }
}
