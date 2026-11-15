interface MapToken {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp?: { value: number; max: number } | undefined;
}

interface MapWall {
  c: number[];
  door: number;
  ds: number;
  move: number;
}

interface CollisionBackend {
  testCollision(
    origin: { x: number; y: number },
    destination: { x: number; y: number },
    config: { type: string; mode: string }
  ): boolean;
}

export interface AsciiMapInput {
  gridSize: number;
  gridDistance: number;
  gridUnits: string;
  sceneName: string;
  tokens: MapToken[];
  walls: MapWall[];
  collisionBackend?: CollisionBackend | undefined;
  center?: { gx: number; gy: number } | undefined;
  radius?: number | undefined;
}

type WallType = 'wall' | 'door' | 'door-open' | 'door-locked' | 'secret';

interface TokenLegendEntry {
  label: string;
  name: string;
  id: string;
  gridX: number;
  gridY: number;
  size: string;
  hp: string;
}

function classifyWall(wall: MapWall): WallType {
  if (wall.door === 1) {
    if (wall.ds === 1) return 'door-open';
    if (wall.ds === 2) return 'door-locked';
    return 'door';
  }
  if (wall.door === 2) return 'secret';
  return 'wall';
}

function findNearestWallType(
  midX: number,
  midY: number,
  walls: MapWall[]
): WallType {
  let minDist = Infinity;
  let type: WallType = 'wall';

  for (const wall of walls) {
    const c0 = wall.c[0] ?? 0;
    const c1 = wall.c[1] ?? 0;
    const c2 = wall.c[2] ?? 0;
    const c3 = wall.c[3] ?? 0;
    const wx = (c0 + c2) / 2;
    const wy = (c1 + c3) / 2;
    const dist = Math.hypot(wx - midX, wy - midY);
    if (dist < minDist) {
      minDist = dist;
      type = classifyWall(wall);
    }
  }

  return type;
}

function verticalWallChar(type: WallType): string {
  const chars: Record<WallType, string> = {
    'wall': '|', 'door': 'D', 'door-open': 'd', 'door-locked': 'L', 'secret': '?'
  };
  return chars[type];
}

function horizontalWallStr(type: WallType): string {
  const strs: Record<WallType, string> = {
    'wall': '---', 'door': '-D-', 'door-open': '-d-', 'door-locked': '-L-', 'secret': '-?-'
  };
  return strs[type];
}

export function generateAsciiMap(input: AsciiMapInput): string {
  const { gridSize, gridDistance, gridUnits, sceneName, tokens, walls, collisionBackend } = input;

  if (!collisionBackend) {
    return `[ASCII map unavailable — no collision backend]`;
  }

  // Build token cell map and legend
  const tokenCells = new Map<string, string>();
  const legend: TokenLegendEntry[] = [];
  let idx = 1;

  for (const token of tokens) {
    const gx = Math.floor(token.x / gridSize);
    const gy = Math.floor(token.y / gridSize);
    const w = token.width;
    const h = token.height;
    const label = String(idx);
    idx++;

    const hpStr = token.hp ? `${String(token.hp.value)}/${String(token.hp.max)}` : '';
    legend.push({
      label,
      name: token.name,
      id: token.id,
      gridX: gx,
      gridY: gy,
      size: w === 1 && h === 1 ? '1x1' : `${String(w)}x${String(h)}`,
      hp: hpStr
    });

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        tokenCells.set(`${String(gx + dx)},${String(gy + dy)}`, label);
      }
    }
  }

  // Determine map bounds
  let minX: number;
  let maxX: number;
  let minY: number;
  let maxY: number;

  const DEFAULT_RADIUS = 12;

  if (input.center) {
    const r = input.radius ?? DEFAULT_RADIUS;
    minX = input.center.gx - r;
    maxX = input.center.gx + r;
    minY = input.center.gy - r;
    maxY = input.center.gy + r;
  } else {
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;

    for (const wall of walls) {
      for (let i = 0; i < 4; i += 2) {
        const wx = Math.floor((wall.c[i] ?? 0) / gridSize);
        const wy = Math.floor((wall.c[i + 1] ?? 0) / gridSize);
        minX = Math.min(minX, wx);
        maxX = Math.max(maxX, wx);
        minY = Math.min(minY, wy);
        maxY = Math.max(maxY, wy);
      }
    }

    for (const token of tokens) {
      const gx = Math.floor(token.x / gridSize);
      const gy = Math.floor(token.y / gridSize);
      minX = Math.min(minX, gx);
      maxX = Math.max(maxX, gx + token.width - 1);
      minY = Math.min(minY, gy);
      maxY = Math.max(maxY, gy + token.height - 1);
    }
  }

  if (!isFinite(minX)) {
    return `[Empty scene — no walls or tokens]`;
  }

  // Padding (only for auto-bounds, not for zoom)
  if (!input.center) {
    minX -= 1;
    maxX += 1;
    minY -= 1;
    maxY += 1;
  }

  // Check wall collisions between adjacent cells
  const wallTypes = new Map<string, WallType>();

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cx = x * gridSize + gridSize / 2;
      const cy = y * gridSize + gridSize / 2;

      const neighbors: Array<[number, number]> = [[1, 0], [0, 1]];
      for (const [ndx, ndy] of neighbors) {
        const nx = (x + ndx) * gridSize + gridSize / 2;
        const ny = (y + ndy) * gridSize + gridSize / 2;

        const blocked = collisionBackend.testCollision(
          { x: cx, y: cy },
          { x: nx, y: ny },
          { type: 'move', mode: 'any' }
        );

        if (blocked) {
          const midX = (cx + nx) / 2;
          const midY = (cy + ny) / 2;
          const type = findNearestWallType(midX, midY, walls);
          const fwd = `${String(x)},${String(y)}->${String(x + ndx)},${String(y + ndy)}`;
          const rev = `${String(x + ndx)},${String(y + ndy)}->${String(x)},${String(y)}`;
          wallTypes.set(fwd, type);
          wallTypes.set(rev, type);
        }
      }
    }
  }

  // Render ASCII
  const lines: string[] = [];

  // X axis header
  let header = '     ';
  for (let x = minX; x <= maxX; x++) {
    header += String(x).padStart(3) + ' ';
  }
  lines.push(header);

  for (let y = minY; y <= maxY; y++) {
    let cellLine = String(y).padStart(4) + ' ';
    let borderLine = '     ';

    for (let x = minX; x <= maxX; x++) {
      const key = `${String(x)},${String(y)}`;
      const tok = tokenCells.get(key);
      const cell = tok !== undefined ? tok.padStart(2) + ' ' : ' · ';

      const rightKey = `${String(x)},${String(y)}->${String(x + 1)},${String(y)}`;
      const rightWall = wallTypes.get(rightKey);
      cellLine += cell + (rightWall !== undefined ? verticalWallChar(rightWall) : ' ');

      const downKey = `${String(x)},${String(y)}->${String(x)},${String(y + 1)}`;
      const downWall = wallTypes.get(downKey);
      borderLine += (downWall !== undefined ? horizontalWallStr(downWall) : '   ') + '+';
    }

    lines.push(cellLine);
    if (y < maxY) lines.push(borderLine);
  }

  // Legend
  lines.push('');
  lines.push('=== LEGEND ===');
  lines.push('| --- = Wall   D -D- = Door   d -d- = Open door   L -L- = Locked   ? -?- = Secret');
  lines.push('');
  lines.push('#   Name                          Size  HP         Position');
  lines.push('\u2500'.repeat(70));

  for (const entry of legend) {
    const num = entry.label.padEnd(3);
    const name = entry.name.padEnd(30);
    const size = entry.size.padEnd(5);
    const hp = entry.hp.padEnd(10);
    const pos = `(${String(entry.gridX)},${String(entry.gridY)})`;
    lines.push(`${num} ${name} ${size} ${hp} ${pos}`);
  }

  return `${sceneName} | ${String(gridDistance)}${gridUnits}/cell\n\n${lines.join('\n')}`;
}
