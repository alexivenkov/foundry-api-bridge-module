import type { SettingScope, SettingValueEntry } from '@/core/settings/domain';

export interface ListSettingsQuery {
  readonly namespace?: string | undefined;
  readonly scope?: SettingScope | undefined;
}

export interface GetSettingQuery {
  readonly namespace: string;
  readonly key: string;
}

export interface SetSettingCommand {
  readonly namespace: string;
  readonly key: string;
  readonly value: unknown;
}

export interface SettingChangeResult extends SettingValueEntry {
  readonly previousValue: unknown;
  readonly changed: boolean;
}
