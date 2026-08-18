import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { toToolResult } from './result.js';

export function registerMasterTools(server: McpServer, client: KabuApiClient): void {
  server.registerTool(
    'kabu_get_symbol_name_future',
    {
      description: '先物の銘柄コードと銘柄名を取得します',
      inputSchema: { derivMonth: z.number(), futureCode: z.string().optional() },
    },
    async ({ derivMonth, futureCode }) =>
      toToolResult(await client.getSymbolNameFuture(derivMonth, futureCode)),
  );
  server.registerTool(
    'kabu_get_symbol_name_option',
    {
      description: 'オプションの銘柄コードと銘柄名を取得します',
      inputSchema: {
        derivMonth: z.number(),
        putOrCall: z.string(),
        strikePrice: z.number(),
        optionCode: z.string().optional(),
      },
    },
    async ({ derivMonth, putOrCall, strikePrice, optionCode }) =>
      toToolResult(
        await client.getSymbolNameOption(derivMonth, putOrCall, strikePrice, optionCode),
      ),
  );
  server.registerTool(
    'kabu_get_symbol_name_minioption_weekly',
    {
      description: 'ミニオプション週間銘柄の銘柄コードと銘柄名を取得します',
      inputSchema: {
        derivMonth: z.number(),
        derivWeekly: z.number(),
        putOrCall: z.string(),
        strikePrice: z.number(),
      },
    },
    async ({ derivMonth, derivWeekly, putOrCall, strikePrice }) =>
      toToolResult(
        await client.getSymbolNameMinioptionWeekly(derivMonth, derivWeekly, putOrCall, strikePrice),
      ),
  );
  server.registerTool(
    'kabu_get_margin_premium',
    {
      description: '銘柄のプレミアム情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getMarginPremium(symbol)),
  );
}
