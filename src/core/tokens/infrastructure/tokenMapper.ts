import { isV14Plus } from '@/compat/foundryVersion';
import { readConventionalVitals } from '@/core/shared';
import type {
  PlacementOptions,
  Token,
  TokenAppearanceChanges,
  TokenChanges,
  TokenDraft,
  TokenPlacement,
  TokenPlacementChanges
} from '@/core/tokens/domain';
import type { AppearanceWriteOptions } from './foundryTokenAppearanceTypes';
import type {
  FoundryTokenDocument,
  FoundryTokenTexture,
  FoundryTokenUpdateOptions
} from './foundryTokenTypes';
import { DISPLAY_MODE_CODE as NAME_DISPLAY_CODE, DISPOSITION_CODE, SHAPE_CODE, dispositionFromCode } from './tokenAppearanceCodes';
import { PLAIN_WRITE_OPTIONS, toFoundryAppearanceData, toFoundryTextureData } from './tokenAppearanceMapper';

export function toToken(document: FoundryTokenDocument): Token {
  const actor = document.actor;
  return {
    id: document.id,
    name: document.name,
    x: document.x,
    y: document.y,
    width: document.width,
    height: document.height,
    elevation: document.elevation,
    rotation: document.rotation,
    hidden: document.hidden,
    textureSrc: document.texture.src,
    disposition: dispositionFromCode(document.disposition),
    actorId: document.actorId !== undefined ? document.actorId : (actor?.id ?? null),
    actorLink: document.actorLink ?? false,
    actor: actor
      ? {
          id: actor.id,
          type: actor.type ?? null,
          statuses: actor.statuses ? [...actor.statuses] : [],
          vitals: readConventionalVitals(actor)
        }
      : null
  };
}

/**
 * A token has no `scale` field: the size multiplier lives in `texture.scaleX` /
 * `texture.scaleY`, where a negative value mirrors the image. Mirroring of the
 * current texture is kept.
 */
export function textureScale(
  scale: number,
  current?: Pick<FoundryTokenTexture, 'scaleX' | 'scaleY'>
): { scaleX: number; scaleY: number } {
  return {
    scaleX: (current?.scaleX ?? 1) < 0 ? -scale : scale,
    scaleY: (current?.scaleY ?? 1) < 0 ? -scale : scale
  };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

/**
 * The appearance and placement fields of a draft or a change. The texture
 * merges the explicit texture changes with the legacy `scale`, which the
 * service never lets come together with `texture.scaleX` / `scaleY`.
 */
function assignAppearance(
  data: Record<string, unknown>,
  changes: TokenAppearanceChanges & TokenPlacementChanges,
  scaled: { scaleX: number; scaleY: number } | undefined,
  options: AppearanceWriteOptions
): void {
  Object.assign(data, toFoundryAppearanceData(changes, options));
  const texture = { ...toFoundryTextureData(changes.texture), ...scaled };
  if (Object.keys(texture).length > 0) {
    data['texture'] = texture;
  }
  if (changes.shape !== undefined) {
    data['shape'] = SHAPE_CODE[changes.shape];
  }
  setIfDefined(data, 'locked', changes.locked);
  setIfDefined(data, 'sort', changes.sort);
}

export function toFoundryTokenCreateData(
  draft: TokenDraft,
  options: AppearanceWriteOptions = PLAIN_WRITE_OPTIONS
): Record<string, unknown> {
  const data: Record<string, unknown> = { actorId: draft.actorId, x: draft.x, y: draft.y };
  setIfDefined(data, 'hidden', draft.hidden);
  setIfDefined(data, 'elevation', draft.elevation);
  setIfDefined(data, 'rotation', draft.rotation);
  setIfDefined(data, 'actorLink', draft.actorLink);
  setIfDefined(data, 'name', draft.name);
  if (draft.nameDisplay !== undefined) {
    data['displayName'] = NAME_DISPLAY_CODE[draft.nameDisplay];
  }
  if (draft.disposition !== undefined) {
    data['disposition'] = DISPOSITION_CODE[draft.disposition];
  }
  setIfDefined(data, 'lockRotation', draft.lockRotation);
  assignAppearance(data, draft, draft.scale !== undefined ? textureScale(draft.scale) : undefined, options);
  return data;
}

export function toFoundryTokenUpdateData(
  changes: TokenChanges,
  current: FoundryTokenDocument,
  options: AppearanceWriteOptions = PLAIN_WRITE_OPTIONS
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'hidden', changes.hidden);
  setIfDefined(data, 'elevation', changes.elevation);
  setIfDefined(data, 'rotation', changes.rotation);
  setIfDefined(data, 'name', changes.name);
  if (changes.nameDisplay !== undefined) {
    data['displayName'] = NAME_DISPLAY_CODE[changes.nameDisplay];
  }
  if (changes.disposition !== undefined) {
    data['disposition'] = DISPOSITION_CODE[changes.disposition];
  }
  setIfDefined(data, 'lockRotation', changes.lockRotation);
  setIfDefined(data, 'actorLink', changes.actorLink);
  assignAppearance(
    data,
    changes,
    changes.scale !== undefined ? textureScale(changes.scale, current.texture) : undefined,
    options
  );
  return data;
}

export function toFoundryPlacementData(placement: TokenPlacement): Record<string, unknown> {
  const data: Record<string, unknown> = { x: placement.x, y: placement.y };
  setIfDefined(data, 'elevation', placement.elevation);
  setIfDefined(data, 'rotation', placement.rotation);
  return data;
}

/**
 * `teleport` is a v11–v13 update option that skips collision and animation for
 * the single step that crosses a door. Foundry 14's movement model dropped it;
 * there the step is an ordinary animated one.
 */
export function toFoundryPlacementOptions(options: PlacementOptions): FoundryTokenUpdateOptions {
  return options.throughDoor && !isV14Plus()
    ? { animate: options.animate, teleport: true }
    : { animate: options.animate };
}
