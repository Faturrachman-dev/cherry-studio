/**
 * API Server config — stub module
 *
 * The API server feature has been stripped (Tier 1).
 * Returns a permanently-disabled config for agent compatibility.
 */

import { API_SERVER_DEFAULTS } from '@shared/config/constant'
import type { ApiServerConfig } from '@types'

class ConfigManagerStub {
  private _config: ApiServerConfig = {
    enabled: false,
    port: API_SERVER_DEFAULTS.PORT,
    host: API_SERVER_DEFAULTS.HOST,
    apiKey: ''
  }

  async load(): Promise<ApiServerConfig> {
    return this._config
  }

  async get(): Promise<ApiServerConfig> {
    return this._config
  }

  async reload(): Promise<ApiServerConfig> {
    return this._config
  }
}

export const config = new ConfigManagerStub()
