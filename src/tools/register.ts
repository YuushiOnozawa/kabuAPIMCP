import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { toToolResult } from './result.js';

const subscriptionNotice =
  'この操作はkabuステーションアプリ全体のPUSH配信購読状態を変更します。他のクライアントの購読状態にも影響する可能性があります';

const requestSchema = z.object({
  Symbols: z.array(
    z.object({
      Symbol: z.string().min(1),
      Exchange: z.number(),
    }),
  ),
});

export function registerRegisterTools(server: McpServer, client: KabuApiClient): void {
  server.registerTool(
    'kabu_register',
    {
      description: `銘柄のPUSH配信購読を登録します。${subscriptionNotice}`,
      inputSchema: requestSchema,
    },
    async (body) => toToolResult(await client.register(body)),
  );
  server.registerTool(
    'kabu_unregister',
    {
      description: `銘柄のPUSH配信購読を解除します。${subscriptionNotice}`,
      inputSchema: requestSchema,
    },
    async (body) => toToolResult(await client.unregister(body)),
  );
  server.registerTool(
    'kabu_unregister_all',
    {
      description: `すべてのPUSH配信購読を解除します。${subscriptionNotice}`,
    },
    async () => toToolResult(await client.unregisterAll()),
  );
}
