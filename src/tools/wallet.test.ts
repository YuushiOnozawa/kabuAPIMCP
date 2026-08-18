import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpClientResult } from '../client/httpClient.js';
import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerWalletTools } from './wallet.js';

const successResult: HttpClientResult<unknown> = {
  kind: 'success',
  status: 200,
  body: { ok: true },
};

const fakeClient = {
  getWalletCash: vi.fn().mockResolvedValue(successResult),
  getWalletCashBySymbol: vi.fn().mockResolvedValue(successResult),
  getWalletMargin: vi.fn().mockResolvedValue(successResult),
  getWalletMarginBySymbol: vi.fn().mockResolvedValue(successResult),
  getWalletFuture: vi.fn().mockResolvedValue(successResult),
  getWalletFutureBySymbol: vi.fn().mockResolvedValue(successResult),
  getWalletOption: vi.fn().mockResolvedValue(successResult),
  getWalletOptionBySymbol: vi.fn().mockResolvedValue(successResult),
} as unknown as KabuApiClient;

let server: McpServer;
let mcpClient: Client;

describe('registerWalletTools', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'wallet-test-server', version: '1.0.0' });
    registerWalletTools(server, fakeClient);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: 'wallet-test-client', version: '1.0.0' });
    await server.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  });

  afterEach(async () => {
    await mcpClient.close();
    await server.close();
  });

  it('calls all wallet tools through MCP validation and converts their results', async () => {
    const cases = [
      ['kabu_get_wallet_cash', {}],
      ['kabu_get_wallet_cash_by_symbol', { symbol: '7203@1' }],
      ['kabu_get_wallet_margin', {}],
      ['kabu_get_wallet_margin_by_symbol', { symbol: '7203@1' }],
      ['kabu_get_wallet_future', {}],
      ['kabu_get_wallet_future_by_symbol', { symbol: 'NK225' }],
      ['kabu_get_wallet_option', {}],
      ['kabu_get_wallet_option_by_symbol', { symbol: 'NK225C30000' }],
    ] as const;

    for (const [name, args] of cases) {
      const result = await mcpClient.callTool({ name, arguments: args });
      expect(result).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
      });
    }

    expect(fakeClient.getWalletCash).toHaveBeenCalledWith();
    expect(fakeClient.getWalletCashBySymbol).toHaveBeenCalledWith('7203@1');
    expect(fakeClient.getWalletMargin).toHaveBeenCalledWith();
    expect(fakeClient.getWalletMarginBySymbol).toHaveBeenCalledWith('7203@1');
    expect(fakeClient.getWalletFuture).toHaveBeenCalledWith();
    expect(fakeClient.getWalletFutureBySymbol).toHaveBeenCalledWith('NK225');
    expect(fakeClient.getWalletOption).toHaveBeenCalledWith();
    expect(fakeClient.getWalletOptionBySymbol).toHaveBeenCalledWith('NK225C30000');
  });

  it('rejects a missing symbol through the SDK schema', async () => {
    const result = await mcpClient.callTool({
      name: 'kabu_get_wallet_cash_by_symbol',
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(fakeClient.getWalletCashBySymbol).not.toHaveBeenCalled();
  });
});
