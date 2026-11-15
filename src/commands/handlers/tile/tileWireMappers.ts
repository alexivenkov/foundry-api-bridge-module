import type { TileResult, TileSummary, TileTexture as WireTileTexture } from '@/commands/types';
import type { SceneTileResult, Tile, TileTexture } from '@/core/tiles';

function toWireTexture(texture: TileTexture): WireTileTexture {
  return {
    src: texture.src,
    tint: texture.tint,
    scaleX: texture.scaleX,
    scaleY: texture.scaleY,
    anchorX: texture.anchorX,
    anchorY: texture.anchorY,
    fit: texture.fit,
    alphaThreshold: texture.alphaThreshold,
    ...(texture.offsetX !== undefined ? { offsetX: texture.offsetX } : {}),
    ...(texture.offsetY !== undefined ? { offsetY: texture.offsetY } : {}),
    ...(texture.rotation !== undefined ? { rotation: texture.rotation } : {})
  };
}

export function toWireTile(tile: Tile): TileSummary {
  return {
    id: tile.id,
    ...(tile.name !== undefined ? { name: tile.name } : {}),
    x: tile.x,
    y: tile.y,
    width: tile.width,
    height: tile.height,
    elevation: tile.elevation,
    sort: tile.sort,
    rotation: tile.rotation,
    alpha: tile.alpha,
    hidden: tile.hidden,
    locked: tile.locked,
    texture: toWireTexture(tile.texture),
    restrictions: { light: tile.restrictions.light, weather: tile.restrictions.weather },
    occlusion: { modes: [...tile.occlusion.modes], alpha: tile.occlusion.alpha },
    video: { loop: tile.video.loop, autoplay: tile.video.autoplay, volume: tile.video.volume },
    ...(tile.levels !== undefined ? { levels: [...tile.levels] } : {})
  };
}

export function toTileResult(result: SceneTileResult): TileResult {
  return { ...toWireTile(result.tile), sceneId: result.sceneId };
}
