import { generateAsciiMap, type AsciiMapInput } from '../AsciiMapGenerator';

function createCollisionBackend(blockedPairs: Array<[{ x: number; y: number }, { x: number; y: number }]> = []) {
  return {
    testCollision: jest.fn((origin: { x: number; y: number }, dest: { x: number; y: number }) => {
      return blockedPairs.some(([a, b]) =>
        (a.x === origin.x && a.y === origin.y && b.x === dest.x && b.y === dest.y) ||
        (b.x === origin.x && b.y === origin.y && a.x === dest.x && a.y === dest.y)
      );
    })
  };
}

function baseInput(overrides?: Partial<AsciiMapInput>): AsciiMapInput {
  return {
    gridSize: 100,
    gridDistance: 5,
    gridUnits: 'ft',
    sceneName: 'Test Scene',
    tokens: [],
    walls: [],
    collisionBackend: createCollisionBackend(),
    ...overrides
  };
}

describe('generateAsciiMap', () => {
  it('should return unavailable message when no collision backend', () => {
    const result = generateAsciiMap(baseInput({ collisionBackend: undefined }));

    expect(result).toContain('ASCII map unavailable');
  });

  it('should return empty scene message when no walls or tokens', () => {
    const result = generateAsciiMap(baseInput());

    expect(result).toContain('Empty scene');
  });

  it('should render tokens with numeric IDs', () => {
    const input = baseInput({
      tokens: [
        { id: 't1', name: 'Goblin', x: 100, y: 100, width: 1, height: 1 },
        { id: 't2', name: 'Dragon', x: 200, y: 100, width: 1, height: 1 }
      ]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain(' 1 ');
    expect(result).toContain(' 2 ');
    expect(result).toContain('1   Goblin');
    expect(result).toContain('2   Dragon');
  });

  it('should show multi-cell tokens', () => {
    const input = baseInput({
      tokens: [
        { id: 't1', name: 'Huge Dragon', x: 100, y: 100, width: 2, height: 2 }
      ]
    });

    const result = generateAsciiMap(input);

    // Token label should appear in all 4 cells of 2x2
    const lines = result.split('\n');
    const tokenLines = lines.filter(l => l.includes(' 1 '));
    expect(tokenLines.length).toBeGreaterThanOrEqual(2);
  });

  it('should include HP in legend', () => {
    const input = baseInput({
      tokens: [
        { id: 't1', name: 'Goblin', x: 100, y: 100, width: 1, height: 1, hp: { value: 5, max: 7 } }
      ]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('5/7');
  });

  it('should show token without HP', () => {
    const input = baseInput({
      tokens: [
        { id: 't1', name: 'Mystery', x: 100, y: 100, width: 1, height: 1 }
      ]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('Mystery');
  });

  it('should show size in legend for large tokens', () => {
    const input = baseInput({
      tokens: [
        { id: 't1', name: 'Ogre', x: 100, y: 100, width: 2, height: 2 }
      ]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('2x2');
  });

  it('should render walls between cells', () => {
    // Wall between (1,1) and (2,1): blocked at grid centers
    const blocked: Array<[{ x: number; y: number }, { x: number; y: number }]> = [
      [{ x: 150, y: 150 }, { x: 250, y: 150 }]
    ];
    const input = baseInput({
      walls: [{ c: [200, 100, 200, 200], door: 0, ds: 0, move: 1 }],
      collisionBackend: createCollisionBackend(blocked),
      tokens: [{ id: 't1', name: 'A', x: 100, y: 100, width: 1, height: 1 }]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('|');
  });

  it('should render doors with D symbol', () => {
    const blocked: Array<[{ x: number; y: number }, { x: number; y: number }]> = [
      [{ x: 150, y: 150 }, { x: 250, y: 150 }]
    ];
    const input = baseInput({
      walls: [{ c: [200, 100, 200, 200], door: 1, ds: 0, move: 1 }],
      collisionBackend: createCollisionBackend(blocked),
      tokens: [{ id: 't1', name: 'A', x: 100, y: 100, width: 1, height: 1 }]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('D');
  });

  it('should render open doors with d symbol', () => {
    const blocked: Array<[{ x: number; y: number }, { x: number; y: number }]> = [
      [{ x: 150, y: 150 }, { x: 250, y: 150 }]
    ];
    const input = baseInput({
      walls: [{ c: [200, 100, 200, 200], door: 1, ds: 1, move: 1 }],
      collisionBackend: createCollisionBackend(blocked),
      tokens: [{ id: 't1', name: 'A', x: 100, y: 100, width: 1, height: 1 }]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('d');
  });

  it('should render secret doors with ? symbol', () => {
    const blocked: Array<[{ x: number; y: number }, { x: number; y: number }]> = [
      [{ x: 150, y: 150 }, { x: 250, y: 150 }]
    ];
    const input = baseInput({
      walls: [{ c: [200, 100, 200, 200], door: 2, ds: 0, move: 1 }],
      collisionBackend: createCollisionBackend(blocked),
      tokens: [{ id: 't1', name: 'A', x: 100, y: 100, width: 1, height: 1 }]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('?');
  });

  it('should render locked doors with L symbol', () => {
    const blocked: Array<[{ x: number; y: number }, { x: number; y: number }]> = [
      [{ x: 150, y: 150 }, { x: 250, y: 150 }]
    ];
    const input = baseInput({
      walls: [{ c: [200, 100, 200, 200], door: 1, ds: 2, move: 1 }],
      collisionBackend: createCollisionBackend(blocked),
      tokens: [{ id: 't1', name: 'A', x: 100, y: 100, width: 1, height: 1 }]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('L');
  });

  it('should include scene name and grid info in header', () => {
    const result = generateAsciiMap(baseInput({
      tokens: [{ id: 't1', name: 'A', x: 100, y: 100, width: 1, height: 1 }]
    }));

    expect(result).toContain('Test Scene');
    expect(result).toContain('5ft/cell');
  });

  it('should include coordinate axes', () => {
    const input = baseInput({
      tokens: [{ id: 't1', name: 'A', x: 500, y: 300, width: 1, height: 1 }]
    });

    const result = generateAsciiMap(input);
    const lines = result.split('\n');

    // Should have X coordinates in header
    const headerLine = lines.find(l => l.trim().match(/^\d/));
    expect(headerLine).toBeDefined();

    // Should have Y coordinates on left
    const dataLine = lines.find(l => l.match(/^\s+\d+\s/));
    expect(dataLine).toBeDefined();
  });

  it('should include legend section', () => {
    const input = baseInput({
      tokens: [
        { id: 't1', name: 'Goblin', x: 100, y: 100, width: 1, height: 1, hp: { value: 7, max: 7 } },
        { id: 't2', name: 'Ogre', x: 200, y: 100, width: 2, height: 2, hp: { value: 40, max: 59 } }
      ]
    });

    const result = generateAsciiMap(input);

    expect(result).toContain('=== LEGEND ===');
    expect(result).toContain('Goblin');
    expect(result).toContain('Ogre');
    expect(result).toContain('7/7');
    expect(result).toContain('40/59');
    expect(result).toContain('2x2');
  });
});
