import type { TableResultData, RollTableResult, RollTableSummary } from '@/commands/types';

export interface FoundryTableResult {
  _id: string;
  type: number | string;
  text: string | undefined;
  name: string | undefined;
  img: string | undefined;
  range: [number, number];
  weight: number;
  drawn: boolean;
  documentCollection: string | undefined;
  documentId: string | undefined;
}

export interface FoundryTableResultsCollection {
  contents: FoundryTableResult[];
}

export interface FoundryRoll {
  total: number;
  formula: string;
}

export interface FoundryRollTableDraw {
  roll: FoundryRoll;
  results: FoundryTableResult[];
}

export interface FoundryRollTable {
  id: string;
  name: string;
  img: string | undefined;
  description: string | undefined;
  formula: string;
  replacement: boolean;
  displayRoll: boolean;
  results: FoundryTableResultsCollection;
  roll(): Promise<FoundryRollTableDraw>;
  draw(options?: { displayChat?: boolean }): Promise<FoundryRollTableDraw>;
  resetResults(): Promise<FoundryRollTable>;
  update(data: Record<string, unknown>): Promise<FoundryRollTable>;
  delete(): Promise<FoundryRollTable>;
}

export interface FoundryRollTableConstructor {
  create(data: Record<string, unknown>): Promise<FoundryRollTable>;
}

export interface FoundryTablesCollection {
  get(id: string): FoundryRollTable | undefined;
  forEach(fn: (table: FoundryRollTable) => void): void;
  documentClass: FoundryRollTableConstructor;
}

export interface FoundryGame {
  tables: FoundryTablesCollection;
}

export function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

function getResultText(result: FoundryTableResult): string {
  return result.text ?? result.name ?? '';
}

function getResultType(result: FoundryTableResult): number {
  if (typeof result.type === 'number') return result.type;
  if (result.type === 'text') return 0;
  if (result.type === 'document') return 1;
  return 0;
}

export function mapTableResultToData(result: FoundryTableResult): TableResultData {
  return {
    id: result._id,
    type: getResultType(result),
    text: getResultText(result),
    img: result.img ?? '',
    range: result.range,
    weight: result.weight,
    drawn: result.drawn,
    documentCollection: result.documentCollection ?? null,
    documentId: result.documentId ?? null
  };
}

export function mapTableToResult(table: FoundryRollTable): RollTableResult {
  return {
    id: table.id,
    name: table.name,
    img: table.img ?? '',
    description: table.description ?? '',
    formula: table.formula,
    replacement: table.replacement,
    displayRoll: table.displayRoll,
    results: table.results.contents.map(mapTableResultToData)
  };
}

export function mapTableToSummary(table: FoundryRollTable): RollTableSummary {
  const contents = table.results.contents;
  return {
    id: table.id,
    name: table.name,
    img: table.img ?? '',
    description: table.description ?? '',
    formula: table.formula,
    replacement: table.replacement,
    totalResults: contents.length,
    drawnResults: contents.filter(r => r.drawn).length
  };
}
