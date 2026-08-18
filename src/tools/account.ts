import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { toToolResult } from './result.js';

export function registerAccountTools(server: McpServer, client: KabuApiClient): void {
  server.registerTool(
    'kabu_get_orders',
    {
      description: '注文情報を取得します',
      inputSchema: z.object({
        product: z.string().optional(),
        id: z.string().optional(),
        updtime: z.string().optional(),
        details: z.string().optional(),
        symbol: z.string().optional(),
        state: z.string().optional(),
        side: z.string().optional(),
        cashmargin: z.string().optional(),
      }),
    },
    async (params) => toToolResult(await client.getOrders(params)),
  );
  server.registerTool(
    'kabu_get_positions',
    {
      description: '保有建玉情報を取得します',
      inputSchema: z.object({
        product: z.string().optional(),
        symbol: z.string().optional(),
        side: z.string().optional(),
        addinfo: z.string().optional(),
      }),
    },
    async (params) => toToolResult(await client.getPositions(params)),
  );
  server.registerTool(
    'kabu_get_api_soft_limit',
    { description: 'APIのソフトリミット情報を取得します' },
    async () => toToolResult(await client.getApiSoftLimit()),
  );
}
