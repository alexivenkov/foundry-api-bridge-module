import type {
  Battlefield,
  BattlefieldReader,
  CanvasCollisions,
  MapCollisionTest,
  SightTest
} from '@/core/combat/domain';
import { toBattlefield } from './battlefieldMapper';
import type { CombatGameProvider } from './combatDocuments';
import type { FoundryBattlefieldGlobals } from './foundryBattlefieldTypes';

export type BattlefieldGlobalsProvider = () => FoundryBattlefieldGlobals;

const fromGlobalThis: BattlefieldGlobalsProvider = () => globalThis as unknown as FoundryBattlefieldGlobals;

/** The scenes of the world, and which of them the GM this module runs as has on the canvas. */
export class FoundryBattlefieldReader implements BattlefieldReader {
  constructor(
    private readonly gameProvider: CombatGameProvider,
    private readonly globals: BattlefieldGlobalsProvider = fromGlobalThis
  ) {}

  readScene(sceneId: string): Battlefield | null {
    const viewed = this.globals().canvas?.scene;
    if (viewed && viewed.id === sceneId) {
      return toBattlefield(viewed, true);
    }
    const scene = this.gameProvider.getGame().scenes.get(sceneId);
    return scene ? toBattlefield(scene, false) : null;
  }

  readViewedScene(): Battlefield | null {
    const scene = this.globals().canvas?.scene;
    return scene ? toBattlefield(scene, true) : null;
  }
}

/** The core's polygon backends. They test against the walls of the scene on the canvas. */
export class FoundryCanvasCollisions implements CanvasCollisions {
  constructor(private readonly globals: BattlefieldGlobalsProvider = fromGlobalThis) {}

  sightTest(): SightTest | undefined {
    const backend = this.globals().CONFIG?.Canvas?.polygonBackends?.sight;
    if (!backend) {
      return undefined;
    }
    return (from, to) => backend.testCollision(from, to, { type: 'sight', mode: 'any' });
  }

  movementTest(): MapCollisionTest | undefined {
    return this.globals().CONFIG?.Canvas?.polygonBackends?.move;
  }
}
