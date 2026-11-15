import { generateAsciiMap, requireScene, type AsciiMapInput, type SceneLocator } from '@/core/shared';
import {
  CanvasNotReadyError,
  type MapCollisionTest,
  type MovementCollisions,
  type SceneContents,
  type SceneImage,
  type SceneListing,
  type SceneReader,
  type SceneViewport,
  type ViewportCapture
} from '@/core/scenes/domain';
import type { DescribeSceneQuery } from './commands';

export interface SceneQueryServiceDependencies {
  readonly scenes: SceneLocator;
  readonly reader: SceneReader;
  readonly collisions: MovementCollisions;
  readonly viewport: SceneViewport;
}

export interface SceneDescription {
  readonly scene: SceneContents;
  readonly asciiMap: string;
  /** Set when a screenshot was asked for and the canvas could be captured. */
  readonly screenshot?: SceneImage | undefined;
}

function toMapInput(scene: SceneContents, collisionTest: MapCollisionTest | undefined): AsciiMapInput {
  return {
    gridSize: scene.grid.size,
    gridDistance: scene.grid.distance,
    gridUnits: scene.grid.units,
    sceneName: scene.name,
    tokens: scene.tokens.map((token) => ({
      id: token.id,
      name: token.name,
      x: token.x,
      y: token.y,
      width: token.width,
      height: token.height,
      hp: token.vitals.hp ?? undefined
    })),
    walls: scene.walls.map((wall) => ({
      c: [...wall.coordinates],
      door: wall.door,
      ds: wall.doorState,
      move: wall.movement
    })),
    collisionBackend: collisionTest
  };
}

export class SceneQueryService {
  constructor(private readonly deps: SceneQueryServiceDependencies) {}

  listScenes(): readonly SceneListing[] {
    return this.deps.reader.listScenes();
  }

  /**
   * Which cells a wall separates comes from the canvas, and so does the
   * screenshot. The canvas only speaks for the scene it shows: any other scene
   * is described without collision tests, which leaves its map unavailable,
   * and without a screenshot.
   */
  describeScene(query: DescribeSceneQuery): SceneDescription {
    const scene = this.deps.reader.readScene(requireScene(this.deps.scenes, query.sceneId).id);
    const onCanvas = this.deps.viewport.viewedSceneId() === scene.id;
    return {
      scene,
      asciiMap: generateAsciiMap(toMapInput(scene, onCanvas ? this.deps.collisions.collisionTest() : undefined)),
      screenshot: onCanvas && query.includeScreenshot ? this.tryCapture() : undefined
    };
  }

  captureViewport(): ViewportCapture {
    const capture = this.deps.viewport.capture();
    if (capture === null) {
      throw new CanvasNotReadyError();
    }
    return capture;
  }

  /** A screenshot is an extra: a canvas that cannot be captured never fails the description. */
  private tryCapture(): SceneImage | undefined {
    try {
      return this.deps.viewport.capture()?.image;
    } catch {
      return undefined;
    }
  }
}
