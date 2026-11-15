import type { RollTableResult, RollTableSummary, TableResultData, TableRollSummary } from '@/commands/types';
import {
  tableResultKindToWireCode,
  type RollTable,
  type RollTableGameProvider,
  type RollTableOverview,
  type RollTableWorkshopGameProvider,
  type TableDraw,
  type TableResult,
  type TableRollGlobalsProvider
} from '@/core/tables';

export interface RollTableHandlerDependencies {
  gameProvider?: RollTableGameProvider;
}

export interface RollTableManagementHandlerDependencies {
  gameProvider?: RollTableWorkshopGameProvider;
  rollGlobals?: TableRollGlobalsProvider;
}

export function toWireTableResult(result: TableResult): TableResultData {
  return {
    id: result.id,
    type: tableResultKindToWireCode(result.kind),
    text: result.text,
    img: result.img,
    range: [...result.range],
    weight: result.weight,
    drawn: result.drawn,
    documentCollection: result.documentCollection,
    documentId: result.documentId
  };
}

export function toWireRollTable(table: RollTable): RollTableResult {
  return {
    id: table.id,
    name: table.name,
    img: table.img,
    description: table.description,
    formula: table.formula,
    replacement: table.replacement,
    displayRoll: table.displayRoll,
    results: table.results.map(toWireTableResult),
    folderId: table.folderId ?? null
  };
}

/** A single draw made one roll: the one it reports. */
export function toWireTableRolls(draw: TableDraw): TableRollSummary[] {
  const rolls = draw.rolls ?? [{ formula: draw.formula, total: draw.total }];
  return rolls.map((roll) => ({ formula: roll.formula, total: roll.total }));
}

export function toWireRollTableSummary(table: RollTableOverview): RollTableSummary {
  return {
    id: table.id,
    name: table.name,
    img: table.img,
    description: table.description,
    formula: table.formula,
    replacement: table.replacement,
    totalResults: table.totalResults,
    drawnResults: table.drawnResults
  };
}
