/**
 * Minimal stub for ApiServerConfig — API Server feature has been stripped.
 * This type is retained so that agent-related code compiles without changes.
 * The config is permanently disabled at runtime.
 */
export type ApiServerConfig = {
  enabled: boolean
  host: string
  port: number
  apiKey: string
}
