/**
 * API Server utilities — stub module
 *
 * The API server feature has been stripped (Tier 1).
 * This stub preserves the exports consumed by agent services.
 */

import { CacheService } from '@main/services/CacheService'
import { loggerService } from '@main/services/LoggerService'
import { reduxService } from '@main/services/ReduxService'
import type { Model, Provider } from '@types'

const logger = loggerService.withContext('ApiServerUtils')

const PROVIDERS_CACHE_KEY = 'api-server:providers'
const PROVIDERS_CACHE_TTL = 10 * 1000

export interface ModelValidationError {
  type: 'invalid_format' | 'provider_not_found' | 'model_not_available' | 'unsupported_provider_type'
  message: string
  code: string
}

export async function getAvailableProviders(): Promise<Provider[]> {
  try {
    const cached = CacheService.get<Provider[]>(PROVIDERS_CACHE_KEY)
    if (cached && cached.length > 0) return cached

    const providers = await reduxService.select('state.llm.providers')
    if (!providers || !Array.isArray(providers)) return []

    const supported = providers.filter(
      (p: Provider) => p.enabled && (p.type === 'openai' || p.type === 'anthropic')
    )
    CacheService.set(PROVIDERS_CACHE_KEY, supported, PROVIDERS_CACHE_TTL)
    return supported
  } catch (error) {
    logger.error('Failed to get providers from Redux store', { error })
    return []
  }
}

export function getRealProviderModel(modelStr: string): string {
  return modelStr.split(':').slice(1).join(':')
}

export async function getProviderByModel(model: string): Promise<Provider | undefined> {
  if (!model || !model.includes(':')) return undefined
  const providers = await getAvailableProviders()
  const providerId = model.split(':')[0]
  return providers.find((p: Provider) => p.id === providerId)
}

export async function validateModelId(model: string): Promise<{
  valid: boolean
  error?: ModelValidationError
  provider?: Provider
  modelId?: string
}> {
  try {
    if (!model || typeof model !== 'string') {
      return { valid: false, error: { type: 'invalid_format', message: 'Model must be a non-empty string', code: 'invalid_model_parameter' } }
    }
    if (!model.includes(':')) {
      return { valid: false, error: { type: 'invalid_format', message: "Invalid model format. Expected: 'provider:model_id'", code: 'invalid_model_format' } }
    }
    const parts = model.split(':')
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return { valid: false, error: { type: 'invalid_format', message: "Both provider and model_id must be non-empty", code: 'invalid_model_format' } }
    }
    const modelId = getRealProviderModel(model)
    const provider = await getProviderByModel(model)
    if (!provider) {
      return { valid: false, error: { type: 'provider_not_found', message: `Provider '${parts[0]}' not found or not supported`, code: 'provider_not_found' } }
    }
    const modelExists = provider.models?.some((m: Model) => m.id === modelId)
    if (!modelExists) {
      return { valid: false, error: { type: 'model_not_available', message: `Model '${modelId}' not available in provider '${parts[0]}'`, code: 'model_not_available' } }
    }
    return { valid: true, provider, modelId }
  } catch (error) {
    logger.error('Error validating model ID', { error, model })
    return { valid: false, error: { type: 'invalid_format', message: 'Failed to validate model ID', code: 'validation_error' } }
  }
}
