import type { GetTemplatesParams, GetTemplatesResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTemplateService,
  getTemplatesRequestSchema,
  toListTemplatesQuery,
  type TemplateWiring
} from '@/core/templates';
import { toWireTemplate } from './templateWireMappers';

export function createGetTemplatesHandler(
  wiring: TemplateWiring = {}
): (params: GetTemplatesParams) => Promise<GetTemplatesResult> {
  const service = createFoundryTemplateService(wiring);

  return function getTemplatesHandler(params: GetTemplatesParams): Promise<GetTemplatesResult> {
    try {
      const result = service.listTemplates(toListTemplatesQuery(parseRequest(getTemplatesRequestSchema, params)));
      return Promise.resolve({ sceneId: result.sceneId, templates: result.templates.map(toWireTemplate) });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getTemplatesHandler = createGetTemplatesHandler();
