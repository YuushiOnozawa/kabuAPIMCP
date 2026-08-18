import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpClientResult } from '../client/httpClient.js';
import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerMasterTools } from './master.js';

const successResult: HttpClientResult<unknown> = {
  kind: 'success',
  status: 200,
  body: { ok: true },
};

const fakeClient = {
  getSymbolNameFuture: vi.fn().mockResolvedValue(successResult),
  getSymbolNameOption: vi.fn().mockResolvedValue(successResult),
  getSymbolNameMinioptionWeekly: vi.fn().mockResolvedValue(successResult),
  getMarginPremium: vi.fn().mockResolvedValue(successResult),
} as unknown as KabuApiClient;

let server: McpServer;
let mcpClient: Client;

describe('registerMasterTools', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'master-test-server', version: '1.0.0' });
    registerMasterTools(server, fakeClient);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: 'master-test-client', version: '1.0.0' });
    await server.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  });

  afterEach(async () => {
    await mcpClient.close();
    await server.close();
  });

  it('calls all master tools through MCP validation', async () => {
    const cases = [
      ['kabu_get_symbol_name_future', { derivMonth: 202608, futureCode: 'NK225' }],
      [
        'kabu_get_symbol_name_option',
        { derivMonth: 202608, putOrCall: 'C', strikePrice: 30000, optionCode: 'NK225op' },
      ],
      [
        'kabu_get_symbol_name_minioption_weekly',
        { derivMonth: 202608, derivWeekly: 1, putOrCall: 'C', strikePrice: 30000 },
      ],
      ['kabu_get_margin_premium', { symbol: '7203@1' }],
    ] as const;

    for (const [name, args] of cases) {
      await expect(mcpClient.callTool({ name, arguments: args })).resolves.toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
      });
    }

    expect(fakeClient.getSymbolNameFuture).toHaveBeenCalledWith(202608, 'NK225');
    expect(fakeClient.getSymbolNameOption).toHaveBeenCalledWith(202608, 'C', 30000, 'NK225op');
    expect(fakeClient.getSymbolNameMinioptionWeekly).toHaveBeenCalledWith(202608, 1, 'C', 30000);
    expect(fakeClient.getMarginPremium).toHaveBeenCalledWith('7203@1');
  });

  it('rejects a future request with a missing numeric property', async () => {
    const result = await mcpClient.callTool({
      name: 'kabu_get_symbol_name_future',
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(fakeClient.getSymbolNameFuture).not.toHaveBeenCalled();
  });
});
