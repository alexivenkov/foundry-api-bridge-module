import type { DeleteTemplateParams, DeleteTemplateResult } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  createFoundryTemplateService,
  deleteTemplateRequestSchema,
  toDeleteTemplateCommand,
  type TemplateWiring
} from '@/core/templates';

export function createDeleteTemplateHandler(
  wiring: TemplateWiring = {}
): (params: DeleteTemplateParams) => Promise<DeleteTemplateResult> {
  const service = createFoundryTemplateService(wiring);

  return async function deleteTemplateHandler(params: DeleteTemplateParams): Promise<DeleteTemplateResult> {
    const command = toDeleteTemplateCommand(parseRequest(deleteTemplateRequestSchema, params));
    const result = await service.deleteTemplate(command);
    return { deleted: true, templateId: result.templateId, sceneId: result.sceneId };
  };
}

export const deleteTemplateHandler = createDeleteTemplateHandler();
