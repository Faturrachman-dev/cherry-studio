import type { LanguageModelV3, LanguageModelV3Middleware } from '@ai-sdk/provider'
import { generateText } from 'ai'

export interface CondenseContextOptions {
  /** The model to use for generating summaries */
  summaryModel: LanguageModelV3
  /** The maximum allowed messages or estimated tokens before condensing triggers */
  maxMessagesThreshold?: number
  /** Number of recent messages to keep intact (always skipping system prompt and recent history) */
  preserveRecentCount?: number
}

export function createCondenseContextMiddleware(options: CondenseContextOptions): LanguageModelV3Middleware {
  const threshold = options.maxMessagesThreshold || 10
  const preserveCount = options.preserveRecentCount || 4

  const condensePrompt = async (prompt: any[]) => {
    if (prompt.length <= threshold) {
      return prompt
    }

    const systemMessages = prompt.filter((p) => p.role === 'system')
    const otherMessages = prompt.filter((p) => p.role !== 'system')

    if (otherMessages.length <= preserveCount) {
      return prompt
    }

    const recentMessages = otherMessages.slice(-preserveCount)
    const messagesToCondense = otherMessages.slice(0, -preserveCount)

    const conversationText = messagesToCondense
      .map((m) => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        return `${m.role}: ${content}`
      })
      .join('\n')

    try {
      const { text: summary } = await generateText({
        model: options.summaryModel,
        prompt: `Please summarize the following conversation history briefly but accurately, preserving key details:\n\n${conversationText}`
      })

      const condensedMessage = {
        role: 'system' as const,
        content: [{ type: 'text' as const, text: `Conversation Summary: ${summary}` }]
      }

      return [...systemMessages, condensedMessage, ...recentMessages]
    } catch (e) {
      console.warn('Failed to condense conversation context, passing original messages', e)
      return prompt
    }
  }

  return {
    specificationVersion: 'v3',

    transformParams: async ({ params }) => {
      if (!params.prompt || !Array.isArray(params.prompt)) {
        return params
      }

      const condensedPrompt = await condensePrompt(params.prompt)
      return {
        ...params,
        prompt: condensedPrompt
      }
    }
  }
}
