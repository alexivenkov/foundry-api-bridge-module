import type { CreateTemplateParams, CreateTemplateResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTemplateService,
  createTemplateRequestSchema,
  toCreateTemplateCommand,
  type TemplateWiring
} from '@/core/templates';
import { toTemplateResult } from './templateWireMappers';

export function createCreateTemplateHandler(
  wiring: TemplateWiring = {}
): (params: CreateTemplateParams) => Promise<CreateTemplateResult> {
  const service = createFoundryTemplateService(wiring);

  return async function createTemplateHandler(params: CreateTemplateParams): Promise<CreateTemplateResult> {
    const command = toCreateTemplateCommand(parseRequest(createTemplateRequestSchema, params));
    return toTemplateResult(await service.createTemplate(command));
  };
}

export const createTemplateHandler = createCreateTemplateHandler();
