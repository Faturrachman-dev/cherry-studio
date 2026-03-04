/**
 * Stub — OCR feature has been stripped from this fork.
 * These exports exist only to keep migrate.ts working at runtime.
 */

export const BUILTIN_OCR_PROVIDERS: any[] = []

export const DEFAULT_OCR_PROVIDER = {
  image: { id: 'stripped' }
}

export const BUILTIN_OCR_PROVIDERS_MAP: Record<string, any> = {
  system: { id: 'system' },
  paddleocr: { id: 'paddleocr' },
  ovocr: { id: 'ovocr' }
}
