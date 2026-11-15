import type { UpdateTemplateParams, UpdateTemplateResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTemplateService,
  toUpdateTemplateCommand,
  updateTemplateRequestSchema,
  type TemplateWiring
} from '@/core/templates';
import { toTemplateResult } from './templateWireMappers';

export function createUpdateTemplateHandler(
  wiring: TemplateWiring = {}
): (params: UpdateTemplateParams) => Promise<UpdateTemplateResult> {
  const service = createFoundryTemplateService(wiring);

  return async function updateTemplateHandler(params: UpdateTemplateParams): Promise<UpdateTemplateResult> {
    const command = toUpdateTemplateCommand(parseRequest(updateTemplateRequestSchema, params));
    return toTemplateResult(await service.updateTemplate(command));
  };
}

export const updateTemplateHandler = createUpdateTemplateHandler();
