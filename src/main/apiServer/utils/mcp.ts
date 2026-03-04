/**
 * MCP server utilities — stub module
 *
 * The API server feature has been stripped (Tier 1).
 * getMCPServersFromRedux is preserved because MCPService depends on it.
 */

import { CacheService } from '@main/services/CacheService'
import { loggerService } from '@main/services/LoggerService'
import { reduxService } from '@main/services/ReduxService'
import type { MCPServer } from '@types'

const logger = loggerService.withContext('MCPApiService')

const MCP_SERVERS_CACHE_KEY = 'api-server:mcp-servers'
const MCP_SERVERS_CACHE_TTL = 5 * 60 * 1000

export async function getMCPServersFromRedux(): Promise<MCPServer[]> {
  try {
    const cached = CacheService.get<MCPServer[]>(MCP_SERVERS_CACHE_KEY)
    if (cached) return cached

    const servers = await reduxService.select<MCPServer[]>('state.mcp.servers')
    const list = servers || []
    CacheService.set(MCP_SERVERS_CACHE_KEY, list, MCP_SERVERS_CACHE_TTL)

    logger.debug('Fetched MCP servers from Redux', { count: list.length })
    return list
  } catch (error) {
    logger.error('Failed to get servers from Redux', { error })
    return []
  }
}
