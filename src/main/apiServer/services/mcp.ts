/**
 * MCP API service — stub module
 *
 * The API server feature has been stripped (Tier 1).
 * This stub exports a no-op mcpApiService for agent compatibility.
 */

import { loggerService } from '@main/services/LoggerService'
import type { MCPTool } from '@types'

const logger = loggerService.withContext('MCPApiService')

interface McpServerInfo {
  id: string
  name: string
  type: string
  description: string
  tools: MCPTool[]
}

class MCPApiServiceStub {
  async getServerInfo(_id: string): Promise<McpServerInfo | null> {
    logger.debug('MCPApiService.getServerInfo called on stub — API server is stripped')
    return null
  }

  async getServerById(_id: string) {
    return null
  }

  async getAllServers() {
    return { servers: {} }
  }
}

export const mcpApiService = new MCPApiServiceStub()
