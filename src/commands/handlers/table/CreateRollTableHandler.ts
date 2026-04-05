import type { CreateRollTableParams, RollTableResult } from '@/commands/types';
import { getGame, mapTableToResult } from './tableTypes';

export async function createRollTableHandler(params: CreateRollTableParams): Promise<RollTableResult> {
  const tableData: Record<string, unknown> = {
    name: params.name,
    formula: params.formula ?? '1d20',
    replacement: params.replacement ?? true,
    displayRoll: params.displayRoll ?? true
  };

  if (params.description !== undefined) {
    tableData['description'] = params.description;
  }

  if (params.img !== undefined) {
    tableData['img'] = params.img;
  }

  if (params.folder !== undefined) {
    tableData['folder'] = params.folder;
  }

  if (params.results !== undefined) {
    tableData['results'] = params.results.map(r => {
      const resultData: Record<string, unknown> = {
        type: r.type ?? 0,
        text: r.text,
        range: r.range,
        weight: r.weight ?? 1
      };

      if (r.img !== undefined) {
        resultData['img'] = r.img;
      }

      if (r.documentCollection !== undefined) {
        resultData['documentCollection'] = r.documentCollection;
      }

      if (r.documentId !== undefined) {
        resultData['documentId'] = r.documentId;
      }

      return resultData;
    });
  }

  const table = await getGame().tables.documentClass.create(tableData);
  return mapTableToResult(table);
}
