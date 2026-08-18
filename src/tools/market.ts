import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { toToolResult } from './result.js';

const exchangeCurrencySchema = z.enum([
  'usdjpy',
  'eurjpy',
  'gbpjpy',
  'audjpy',
  'chfjpy',
  'cadjpy',
  'nzdjpy',
  'zarjpy',
  'eurusd',
  'gbpusd',
  'audusd',
]);

export function registerMarketTools(server: McpServer, client: KabuApiClient): void {
  server.registerTool(
    'kabu_get_board',
    {
      description: '銘柄の板情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getBoard(symbol)),
  );
  server.registerTool(
    'kabu_get_symbol',
    {
      description: '銘柄情報を取得します',
      inputSchema: { symbol: z.string().min(1), addinfo: z.string().optional() },
    },
    async ({ symbol, addinfo }) => toToolResult(await client.getSymbol(symbol, addinfo)),
  );
  server.registerTool(
    'kabu_get_ranking',
    {
      description: '銘柄ランキングを取得します',
      inputSchema: { type: z.string(), exchangeDivision: z.string() },
    },
    async ({ type, exchangeDivision }) =>
      toToolResult(await client.getRanking(type, exchangeDivision)),
  );
  server.registerTool(
    'kabu_get_exchange',
    {
      description: '指定通貨ペアの為替情報を取得します',
      inputSchema: { currency: exchangeCurrencySchema },
    },
    async ({ currency }) => toToolResult(await client.getExchange(currency)),
  );
  server.registerTool(
    'kabu_get_regulations',
    {
      description: '銘柄の取引規制情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getRegulations(symbol)),
  );
  server.registerTool(
    'kabu_get_primary_exchange',
    {
      description: '銘柄の主市場情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getPrimaryExchange(symbol)),
  );
  server.registerTool(
    'kabu_get_time_and_sales',
    {
      description: '銘柄の歩み値情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getTimeAndSales(symbol)),
  );
}
