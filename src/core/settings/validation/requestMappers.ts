import type { GetSettingQuery, ListSettingsQuery, SetSettingCommand } from '@/core/settings/application';
import { emptyAsAbsent } from '@/core/shared';
import type { GetSettingRequest, GetSettingsRequest, SetSettingRequest } from './settingSchemas';

export function toListSettingsQuery(request: GetSettingsRequest): ListSettingsQuery {
  return { namespace: emptyAsAbsent(request.namespace), scope: request.scope ?? undefined };
}

export function toGetSettingQuery(request: GetSettingRequest): GetSettingQuery {
  return { namespace: request.namespace, key: request.key };
}

export function toSetSettingCommand(request: SetSettingRequest): SetSettingCommand {
  return { namespace: request.namespace, key: request.key, value: request.value };
}
