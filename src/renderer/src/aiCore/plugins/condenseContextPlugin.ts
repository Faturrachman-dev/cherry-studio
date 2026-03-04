import type { LanguageModelV3 } from '@ai-sdk/provider'
import { definePlugin } from '@cherrystudio/ai-core'
import { loggerService } from '@logger'
import type { LanguageModelMiddleware } from 'ai'
import { generateText } from 'ai'

const logger = loggerService.withContext('condenseContextPlugin')

export interface CondenseContextPluginOptions {
  /** The model to use for generating summaries */
  summaryModel: LanguageModelV3
  /** The maximum allowed messages before condensing triggers */
  maxMessagesThreshold: number
  /** Number of recent messages to keep intact (always preserving system prompt and recent history) */
  preserveRecentCount: number
}

const CONDENSE_SYSTEM_PROMPT = `You are a conversation summarizer. Your task is to produce a concise but accurate summary of the conversation history provided. Preserve key facts, decisions, user preferences, and any technical details. Keep the summary structured and brief.`

/**
 * Creates an AI SDK V3 middleware that condenses older conversation messages
 * into a summary when the message count exceeds the configured threshold.
 */
function createCondenseContextMiddleware(options: CondenseContextPluginOptions): LanguageModelMiddleware {
  const { summaryModel, maxMessagesThreshold, preserveRecentCount } = options

  const condensePrompt = async (prompt: any[]): Promise<any[]> => {
    if (prompt.length <= maxMessagesThreshold) {
      logger.debug(
        `Prompt has ${prompt.length} messages, below threshold of ${maxMessagesThreshold}. Skipping condensation.`
      )
      return prompt
    }

    const systemMessages = prompt.filter((m) => m.role === 'system')
    const nonSystemMessages = prompt.filter((m) => m.role !== 'system')

    if (nonSystemMessages.length <= preserveRecentCount) {
      logger.debug('Not enough non-system messages to condense. Skipping.')
      return prompt
    }

    const recentMessages = nonSystemMessages.slice(-preserveRecentCount)
    const messagesToCondense = nonSystemMessages.slice(0, -preserveRecentCount)

    // Build a text representation of the messages to condense
    const conversationText = messagesToCondense
      .map((m) => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        return `[${m.role}]: ${content}`
      })
      .join('\n')

    try {
      logger.info(`Condensing ${messagesToCondense.length} older messages into a summary...`)

      const { text: summary } = await generateText({
        model: summaryModel,
        system: CONDENSE_SYSTEM_PROMPT,
        prompt: `Please summarize the following conversation history:\n\n${conversationText}`
      })

      logger.info(`Condensation complete. Summary length: ${summary.length} chars.`)

      const condensedMessage = {
        role: 'system' as const,
        content: [{ type: 'text' as const, text: `[Conversation Summary]\n${summary}` }]
      }

      return [...systemMessages, condensedMessage, ...recentMessages]
    } catch (error) {
      logger.warn('Failed to condense conversation context. Passing original messages.', error as Error)
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

/**
 * Plugin that wraps the condense context middleware for use in the Cherry Studio AI Core plugin system.
 */
export const createCondenseContextPlugin = (options: CondenseContextPluginOptions) =>
  definePlugin({
    name: 'condenseContext',
    enforce: 'pre',

    configureContext: (context) => {
      context.middlewares = context.middlewares || []
      context.middlewares.push(createCondenseContextMiddleware(options))
    }
  })
