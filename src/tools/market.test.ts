import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpClientResult } from '../client/httpClient.js';
import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerMarketTools } from './market.js';

const successResult: HttpClientResult<unknown> = {
  kind: 'success',
  status: 200,
  body: { ok: true },
};

const fakeClient = {
  getBoard: vi.fn().mockResolvedValue(successResult),
  getSymbol: vi.fn().mockResolvedValue(successResult),
  getRanking: vi.fn().mockResolvedValue(successResult),
  getExchange: vi.fn().mockResolvedValue(successResult),
  getRegulations: vi.fn().mockResolvedValue(successResult),
  getPrimaryExchange: vi.fn().mockResolvedValue(successResult),
  getTimeAndSales: vi.fn().mockResolvedValue(successResult),
} as unknown as KabuApiClient;

let server: McpServer;
let mcpClient: Client;

describe('registerMarketTools', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'market-test-server', version: '1.0.0' });
    registerMarketTools(server, fakeClient);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: 'market-test-client', version: '1.0.0' });
    await server.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  });

  afterEach(async () => {
    await mcpClient.close();
    await server.close();
  });

  it('calls all market tools through MCP validation', async () => {
    const cases = [
      ['kabu_get_board', { symbol: '7203@1' }],
      ['kabu_get_symbol', { symbol: '7203@1', addinfo: 'true' }],
      ['kabu_get_ranking', { type: '1', exchangeDivision: 'ALL' }],
      ['kabu_get_exchange', { currency: 'usdjpy' }],
      ['kabu_get_regulations', { symbol: '7203@1' }],
      ['kabu_get_primary_exchange', { symbol: '7203@1' }],
      ['kabu_get_time_and_sales', { symbol: '7203@1' }],
    ] as const;

    for (const [name, args] of cases) {
      await expect(mcpClient.callTool({ name, arguments: args })).resolves.toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
      });
    }

    expect(fakeClient.getBoard).toHaveBeenCalledWith('7203@1');
    expect(fakeClient.getSymbol).toHaveBeenCalledWith('7203@1', 'true');
    expect(fakeClient.getRanking).toHaveBeenCalledWith('1', 'ALL');
    expect(fakeClient.getExchange).toHaveBeenCalledWith('usdjpy');
    expect(fakeClient.getRegulations).toHaveBeenCalledWith('7203@1');
    expect(fakeClient.getPrimaryExchange).toHaveBeenCalledWith('7203@1');
    expect(fakeClient.getTimeAndSales).toHaveBeenCalledWith('7203@1');
  });

  it('rejects a ranking request with a missing required property', async () => {
    const result = await mcpClient.callTool({
      name: 'kabu_get_ranking',
      arguments: { type: '1' },
    });

    expect(result.isError).toBe(true);
    expect(fakeClient.getRanking).not.toHaveBeenCalled();
  });
});
