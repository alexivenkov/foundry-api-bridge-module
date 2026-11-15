import type {
  CompendiumSummary,
  GamePause,
  WorldClock,
  WorldDocumentCounts,
  WorldIdentity,
  WorldInspector
} from '../../domain';

export const identity: WorldIdentity = {
  id: 'my-world',
  title: 'My World',
  systemId: 'dnd5e',
  systemVersion: '5.1.0',
  coreVersion: '13.351',
  moduleVersion: '8.18.0'
};

export const counts: WorldDocumentCounts = { journals: 3, actors: 2, items: 4, scenes: 1 };

export const compendiums: readonly CompendiumSummary[] = [
  { id: 'dnd5e.monsters', label: 'Monsters', documentType: 'Actor', systemId: 'dnd5e', entryCount: 350 },
  { id: 'world.tables', label: 'Tables', documentType: 'RollTable', systemId: null, entryCount: 5 }
];

export class FakeWorldInspector implements WorldInspector {
  readonly reads: string[] = [];

  readIdentity(): WorldIdentity {
    this.reads.push('identity');
    return identity;
  }

  countDocuments(): WorldDocumentCounts {
    this.reads.push('counts');
    return counts;
  }

  listCompendiums(): readonly CompendiumSummary[] {
    this.reads.push('compendiums');
    return compendiums;
  }
}

export class FakeWorldClock implements WorldClock {
  readonly calls: string[] = [];
  /** What the clock shows once a change has landed, when the core rounds or refuses it. */
  landsOn: number | undefined;

  constructor(private time: number) {}

  now(): number {
    return this.time;
  }

  advance(seconds: number): Promise<void> {
    this.calls.push(`advance:${String(seconds)}`);
    this.time = this.landsOn ?? this.time + seconds;
    return Promise.resolve();
  }

  set(worldTime: number): Promise<void> {
    this.calls.push(`set:${String(worldTime)}`);
    this.time = this.landsOn ?? worldTime;
    return Promise.resolve();
  }
}

export class FakeGamePause implements GamePause {
  readonly calls: boolean[] = [];

  constructor(private paused: boolean) {}

  isPaused(): boolean {
    return this.paused;
  }

  setPaused(paused: boolean): void {
    this.calls.push(paused);
    this.paused = paused;
  }
}
