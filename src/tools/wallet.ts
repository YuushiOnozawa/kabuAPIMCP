import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { toToolResult } from './result.js';

export function registerWalletTools(server: McpServer, client: KabuApiClient): void {
  server.registerTool(
    'kabu_get_wallet_cash',
    { description: '現物・信用の買付余力（現金残高）を取得します' },
    async () => toToolResult(await client.getWalletCash()),
  );
  server.registerTool(
    'kabu_get_wallet_cash_by_symbol',
    {
      description: '銘柄ごとの現物・信用の買付余力（現金残高）を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getWalletCashBySymbol(symbol)),
  );
  server.registerTool(
    'kabu_get_wallet_margin',
    { description: '信用取引の余力・保証金情報を取得します' },
    async () => toToolResult(await client.getWalletMargin()),
  );
  server.registerTool(
    'kabu_get_wallet_margin_by_symbol',
    {
      description: '銘柄ごとの信用取引の余力・保証金情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getWalletMarginBySymbol(symbol)),
  );
  server.registerTool(
    'kabu_get_wallet_future',
    { description: '先物取引の余力・証拠金情報を取得します' },
    async () => toToolResult(await client.getWalletFuture()),
  );
  server.registerTool(
    'kabu_get_wallet_future_by_symbol',
    {
      description: '銘柄ごとの先物取引の余力・証拠金情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getWalletFutureBySymbol(symbol)),
  );
  server.registerTool(
    'kabu_get_wallet_option',
    { description: 'オプション取引の余力・証拠金情報を取得します' },
    async () => toToolResult(await client.getWalletOption()),
  );
  server.registerTool(
    'kabu_get_wallet_option_by_symbol',
    {
      description: '銘柄ごとのオプション取引の余力・証拠金情報を取得します',
      inputSchema: { symbol: z.string().min(1) },
    },
    async ({ symbol }) => toToolResult(await client.getWalletOptionBySymbol(symbol)),
  );
}
