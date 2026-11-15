import type {
  CaptureSceneResult,
  ConfiguredSceneSummary,
  GetSceneLevelsResult,
  SceneAmbienceResult,
  SceneDetailResult,
  SceneLevelResult,
  SceneLevelSummary,
  SceneScreenshot,
  SceneSettingsResult,
  SceneSummary,
  SceneSummaryResult,
  SceneTokenSummary,
  SceneWeatherEffect
} from '@/commands/types';
import {
  gridCellAt,
  type ConfiguredScene,
  type LevelOfScene,
  type Scene,
  type SceneAmbience,
  type SceneDetails,
  type SceneImage,
  type SceneLevel,
  type SceneLevels,
  type SceneListing,
  type SceneSettings,
  type SceneToken,
  type ViewportCapture,
  type WeatherEffect
} from '@/core/scenes';

export function toWireScene(scene: Scene): SceneSummary {
  return {
    id: scene.id,
    uuid: scene.uuid,
    name: scene.name,
    active: scene.active,
    width: scene.width,
    height: scene.height,
    background: scene.backgroundSrc,
    navigation: scene.navigation,
    navName: scene.navName,
    navOrder: scene.navOrder,
    folder: scene.folderName,
    grid: {
      type: scene.grid.type,
      size: scene.grid.size,
      distance: scene.grid.distance,
      units: scene.grid.units
    }
  };
}

export function toWireSceneListing(listing: SceneListing): SceneSummaryResult {
  return {
    id: listing.id,
    name: listing.name,
    active: listing.active,
    img: listing.image
  };
}

function toWireSceneToken(token: SceneToken, cellSize: number): SceneTokenSummary {
  const cell = gridCellAt(token.x, token.y, cellSize);
  const result: SceneTokenSummary = {
    id: token.id,
    name: token.name,
    actorId: token.actorId,
    gridX: cell.column,
    gridY: cell.row,
    x: token.x,
    y: token.y,
    elevation: token.elevation,
    hidden: token.hidden,
    disposition: token.disposition,
    conditions: [...token.statuses]
  };

  if (token.vitals.hp) {
    result.hp = { value: token.vitals.hp.value, max: token.vitals.hp.max };
  }
  if (token.vitals.ac !== null) {
    result.ac = token.vitals.ac;
  }

  return result;
}

function toWireScreenshot(image: SceneImage): SceneScreenshot {
  return {
    image: image.data,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height
  };
}

function toWireAmbience(ambience: SceneAmbience): SceneAmbienceResult {
  return {
    hue: ambience.hue,
    intensity: ambience.intensity,
    luminosity: ambience.luminosity,
    saturation: ambience.saturation,
    shadows: ambience.shadows
  };
}

export function toWireSceneSettings(settings: SceneSettings): SceneSettingsResult {
  const { environment, fog, initialView, links, grid } = settings;
  const light = environment.globalLight;
  const result: SceneSettingsResult = {
    weather: settings.weather,
    tokenVision: settings.tokenVision,
    environment: {
      darkness: environment.darkness,
      darknessLock: environment.darknessLock,
      blendAmbience: environment.blendAmbience,
      globalLight: {
        enabled: light.enabled,
        bright: light.bright,
        color: light.color,
        alpha: light.alpha,
        luminosity: light.luminosity,
        saturation: light.saturation,
        contrast: light.contrast,
        shadows: light.shadows,
        darkness: { min: light.darkness.min, max: light.darkness.max }
      },
      baseAmbience: toWireAmbience(environment.baseAmbience),
      darkAmbience: toWireAmbience(environment.darkAmbience)
    },
    fog: {
      exploration: fog.exploration,
      overlay: fog.overlaySrc,
      exploredColor: fog.exploredColor,
      unexploredColor: fog.unexploredColor
    },
    initialView: { x: initialView.x, y: initialView.y, scale: initialView.scale },
    playlistId: links.playlistId,
    playlistSoundId: links.playlistSoundId,
    journalId: links.journalId,
    journalPageId: links.journalPageId,
    grid: { style: grid.style, color: grid.color, alpha: grid.alpha, thickness: grid.thickness },
    foreground: settings.foregroundSrc,
    foregroundElevation: settings.foregroundElevation,
    backgroundColor: settings.backgroundColor
  };
  if (settings.initialLevelId !== undefined) {
    result.initialLevelId = settings.initialLevelId;
  }
  return result;
}

/** `create-scene` and `update-scene`: the original summary, with the settings added. */
export function toWireConfiguredScene({ scene, settings }: ConfiguredScene): ConfiguredSceneSummary {
  return { ...toWireScene(scene), settings: toWireSceneSettings(settings) };
}

export function toWireWeatherEffect(effect: WeatherEffect): SceneWeatherEffect {
  return { id: effect.id, label: effect.label };
}

function toWireLevel(level: SceneLevel, initialLevelId: string | null): SceneLevelSummary {
  const { elevation, background, foreground, positioning } = level;
  return {
    id: level.id,
    name: level.name,
    elevation: { bottom: elevation.bottom, top: elevation.top },
    background: {
      src: background.src,
      color: background.color,
      tint: background.tint,
      alphaThreshold: background.alphaThreshold
    },
    foreground: { src: foreground.src, tint: foreground.tint, alphaThreshold: foreground.alphaThreshold },
    fogOverlay: level.fogOverlaySrc,
    positioning: {
      anchorX: positioning.anchorX,
      anchorY: positioning.anchorY,
      offsetX: positioning.offsetX,
      offsetY: positioning.offsetY,
      fit: positioning.fit,
      scaleX: positioning.scaleX,
      scaleY: positioning.scaleY,
      rotation: positioning.rotation
    },
    visibleLevelIds: [...level.visibleLevelIds],
    sort: level.sort,
    initial: level.id === initialLevelId
  };
}

export function toWireSceneLevels(levels: SceneLevels): GetSceneLevelsResult {
  return {
    sceneId: levels.sceneId,
    initialLevelId: levels.initialLevelId,
    levels: levels.levels.map((level) => toWireLevel(level, levels.initialLevelId))
  };
}

export function toWireLevelResult({ sceneId, level, initialLevelId }: LevelOfScene): SceneLevelResult {
  return { ...toWireLevel(level, initialLevelId), sceneId };
}

/** `get-scene` reports the core's numeric codes as they are; `sense` is the wire name of a wall's `sight`. */
export function toWireSceneDetail({ scene, asciiMap, screenshot, settings }: SceneDetails): SceneDetailResult {
  const detail: SceneDetailResult = {
    id: scene.id,
    name: scene.name,
    active: scene.active,
    img: scene.image,
    width: scene.width,
    height: scene.height,
    grid: {
      size: scene.grid.size,
      type: scene.grid.typeCode,
      units: scene.grid.units,
      distance: scene.grid.distance
    },
    darkness: scene.darkness,
    notes: scene.notes.map((note) => ({
      x: note.x,
      y: note.y,
      text: note.text,
      label: note.label,
      entryId: note.entryId
    })),
    walls: scene.walls.map((wall) => ({
      id: wall.id,
      c: [...wall.coordinates],
      move: wall.movement,
      sense: wall.sight,
      door: wall.door,
      ds: wall.doorState
    })),
    lights: scene.lights.map((light) => ({
      x: light.x,
      y: light.y,
      bright: light.bright,
      dim: light.dim,
      color: light.color,
      angle: light.angle,
      walls: light.walls,
      hidden: light.hidden
    })),
    tiles: scene.tiles.map((tile) => ({
      x: tile.x,
      y: tile.y,
      width: tile.width,
      height: tile.height,
      img: tile.textureSrc,
      hidden: tile.hidden,
      elevation: tile.elevation,
      rotation: tile.rotation
    })),
    drawings: scene.drawings.map((drawing) => ({
      x: drawing.x,
      y: drawing.y,
      shape: {
        type: drawing.shape.type,
        width: drawing.shape.width,
        height: drawing.shape.height,
        points: [...drawing.shape.points]
      },
      text: drawing.text,
      hidden: drawing.hidden,
      fillColor: drawing.fillColor,
      strokeColor: drawing.strokeColor
    })),
    regions: scene.regions.map((region) => ({
      id: region.id,
      name: region.name,
      color: region.color,
      shapes: region.shapeTypes.map((type) => ({ type }))
    })),
    tokens: scene.tokens.map((token) => toWireSceneToken(token, scene.grid.size)),
    asciiMap,
    settings: toWireSceneSettings(settings)
  };

  if (screenshot !== undefined) {
    detail.screenshot = toWireScreenshot(screenshot);
  }

  return detail;
}

export function toWireCapture(capture: ViewportCapture): CaptureSceneResult {
  return {
    sceneId: capture.sceneId,
    sceneName: capture.sceneName,
    image: capture.image.data,
    mimeType: capture.image.mimeType,
    width: capture.image.width,
    height: capture.image.height
  };
}
