import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import type {
  PlacementOptions,
  SceneGrid,
  SceneGridReader,
  Token,
  TokenAppearanceDetail,
  TokenAppearanceReader,
  TokenChanges,
  TokenDraft,
  TokenPlacement,
  TokenStore
} from '@/core/tokens/domain';
import type { AppearanceWriteOptions } from './foundryTokenAppearanceTypes';
import type { FoundryTokenGame, FoundryTokenScene } from './foundryTokenTypes';
import { toTokenAppearanceDetail } from './tokenAppearanceMapper';
import { appearanceWriteOptions } from './writeOptions';
import {
  toFoundryPlacementData,
  toFoundryPlacementOptions,
  toFoundryTokenCreateData,
  toFoundryTokenUpdateData,
  toToken
} from './tokenMapper';

export type TokenGameProvider = GameProvider<FoundryTokenGame>;

/** Anti-corruption layer over a scene's embedded Token documents and its grid settings. */
export class FoundryTokenStore implements TokenStore, SceneGridReader, TokenAppearanceReader {
  constructor(
    private readonly gameProvider: TokenGameProvider,
    private readonly writeOptions: () => AppearanceWriteOptions = appearanceWriteOptions
  ) {}

  listTokens(sceneId: string): readonly Token[] {
    return this.requireScene(sceneId).tokens.contents.map(toToken);
  }

  findToken(sceneId: string, tokenId: string): Token | null {
    const document = this.requireScene(sceneId).tokens.get(tokenId);
    return document !== undefined ? toToken(document) : null;
  }

  async createToken(sceneId: string, draft: TokenDraft): Promise<Token | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('Token', [
      toFoundryTokenCreateData(draft, this.writeOptions())
    ]);
    const document = created[0];
    return document !== undefined ? toToken(document) : null;
  }

  async updateToken(sceneId: string, tokenId: string, changes: TokenChanges): Promise<Token | null> {
    const document = this.requireScene(sceneId).tokens.get(tokenId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryTokenUpdateData(changes, document, this.writeOptions()));
    return toToken(document);
  }

  async placeToken(
    sceneId: string,
    tokenId: string,
    placement: TokenPlacement,
    options: PlacementOptions
  ): Promise<Token | null> {
    const scene = this.requireScene(sceneId);
    const document = scene.tokens.get(tokenId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryPlacementData(placement), toFoundryPlacementOptions(options));
    const moved = scene.tokens.get(tokenId);
    return moved !== undefined ? toToken(moved) : null;
  }

  async deleteToken(sceneId: string, tokenId: string): Promise<void> {
    await this.requireScene(sceneId).tokens.get(tokenId)?.delete();
  }

  /** null when the token is gone or carries no stored data to read. */
  findAppearance(sceneId: string, tokenId: string): TokenAppearanceDetail | null {
    const source = this.requireScene(sceneId).tokens.get(tokenId)?._source;
    return source !== undefined ? toTokenAppearanceDetail(source) : null;
  }

  readGrid(sceneId: string): SceneGrid {
    const grid = this.requireScene(sceneId).grid;
    return {
      size: grid?.size ?? null,
      distance: grid?.distance ?? null,
      units: grid?.units ?? null
    };
  }

  private requireScene(sceneId: string): FoundryTokenScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
