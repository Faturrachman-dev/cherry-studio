import type { LanguageModelV3 } from '@ai-sdk/provider'
import { describe, expect, it, vi } from 'vitest'

import { createCondenseContextMiddleware } from '../core/middleware/condense'

// Mock Vercel AI SDK generateText
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'This is a summary of the conversation.' })
}))

describe('createCondenseContextMiddleware', () => {
  const dummyModel: LanguageModelV3 = {} as any

  it('passes messages through if below threshold', async () => {
    const mw = createCondenseContextMiddleware({
      summaryModel: dummyModel,
      maxMessagesThreshold: 10,
      preserveRecentCount: 2
    })

    const params = {
      prompt: [{ role: 'user', content: 'hello' }]
    }

    // V3 middleware uses transformParams
    const result = await mw.transformParams!({ params: params as any, type: 'generate' as any, model: dummyModel as any })

    expect(result.prompt).toEqual([{ role: 'user', content: 'hello' }])
  })

  it('condenses older messages when threshold exceeded', async () => {
    const mw = createCondenseContextMiddleware({
      summaryModel: dummyModel,
      maxMessagesThreshold: 4,
      preserveRecentCount: 2
    })

    const prompt = Array.from({ length: 6 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`
    }))

    const result = await mw.transformParams!({ params: { prompt } as any, type: 'generate' as any, model: dummyModel as any })

    // Should have: 1 system summary + 2 recent messages = 3 total
    expect(result.prompt).toHaveLength(3)
    expect(result.prompt[0].role).toBe('system')
    expect(result.prompt[0].content[0].text).toContain('This is a summary')
    expect(result.prompt[1].content).toBe('Message 4')
    expect(result.prompt[2].content).toBe('Message 5')
  })

  it('preserves system messages during condensation', async () => {
    const mw = createCondenseContextMiddleware({
      summaryModel: dummyModel,
      maxMessagesThreshold: 4,
      preserveRecentCount: 2
    })

    const prompt = [
      { role: 'system', content: 'You are a helpful assistant.' },
      ...Array.from({ length: 6 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`
      }))
    ]

    const result = await mw.transformParams!({ params: { prompt } as any, type: 'generate' as any, model: dummyModel as any })

    // Should have: 1 original system + 1 summary system + 2 recent = 4
    expect(result.prompt).toHaveLength(4)
    expect(result.prompt[0].role).toBe('system')
    expect(result.prompt[0].content).toBe('You are a helpful assistant.')
    expect(result.prompt[1].role).toBe('system')
    expect(result.prompt[1].content[0].text).toContain('Conversation Summary')
  })

  it('passes through when non-system messages are fewer than preserveRecentCount', async () => {
    const mw = createCondenseContextMiddleware({
      summaryModel: dummyModel,
      maxMessagesThreshold: 2,
      preserveRecentCount: 4
    })

    const prompt = [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Bye' }
    ]

    const result = await mw.transformParams!({ params: { prompt } as any, type: 'generate' as any, model: dummyModel as any })

    // All 4 messages should pass through since non-system count (3) <= preserveRecentCount (4)
    expect(result.prompt).toHaveLength(4)
  })
})
