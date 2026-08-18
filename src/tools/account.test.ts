import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpClientResult } from '../client/httpClient.js';
import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerAccountTools } from './account.js';

const successResult: HttpClientResult<unknown> = {
  kind: 'success',
  status: 200,
  body: { ok: true },
};

const fakeClient = {
  getOrders: vi.fn().mockResolvedValue(successResult),
  getPositions: vi.fn().mockResolvedValue(successResult),
  getApiSoftLimit: vi.fn().mockResolvedValue(successResult),
} as unknown as KabuApiClient;

let server: McpServer;
let mcpClient: Client;

describe('registerAccountTools', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'account-test-server', version: '1.0.0' });
    registerAccountTools(server, fakeClient);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: 'account-test-client', version: '1.0.0' });
    await server.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  });

  afterEach(async () => {
    await mcpClient.close();
    await server.close();
  });

  it('passes account parameter objects unchanged and calls all tools', async () => {
    const orders = {
      product: '1',
      id: 'order-1',
      updtime: '2026-08-17T12:34:56',
      details: 'true',
      symbol: '7203@1',
      state: '2',
      side: '1',
      cashmargin: '2',
    };
    const positions = { product: '1', symbol: '7203@1', side: '1', addinfo: 'true' };

    await expect(
      mcpClient.callTool({ name: 'kabu_get_orders', arguments: orders }),
    ).resolves.toMatchObject({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });
    await expect(
      mcpClient.callTool({ name: 'kabu_get_positions', arguments: positions }),
    ).resolves.toMatchObject({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });
    await expect(
      mcpClient.callTool({ name: 'kabu_get_api_soft_limit', arguments: {} }),
    ).resolves.toMatchObject({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });

    expect(fakeClient.getOrders).toHaveBeenCalledWith(orders);
    expect(fakeClient.getPositions).toHaveBeenCalledWith(positions);
    expect(fakeClient.getApiSoftLimit).toHaveBeenCalledWith();
  });

  it('rejects an account filter with a non-string value', async () => {
    const result = await mcpClient.callTool({
      name: 'kabu_get_orders',
      arguments: { product: 1 },
    });

    expect(result.isError).toBe(true);
    expect(fakeClient.getOrders).not.toHaveBeenCalled();
  });
});
