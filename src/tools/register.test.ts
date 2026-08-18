import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpClientResult } from '../client/httpClient.js';
import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerRegisterTools } from './register.js';

const successResult: HttpClientResult<unknown> = {
  kind: 'success',
  status: 200,
  body: { ok: true },
};

const fakeClient = {
  register: vi.fn().mockResolvedValue(successResult),
  unregister: vi.fn().mockResolvedValue(successResult),
  unregisterAll: vi.fn().mockResolvedValue(successResult),
} as unknown as KabuApiClient;

let server: McpServer;
let mcpClient: Client;

describe('registerRegisterTools', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'register-test-server', version: '1.0.0' });
    registerRegisterTools(server, fakeClient);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: 'register-test-client', version: '1.0.0' });
    await server.connect(serverTransport);
    await mcpClient.connect(clientTransport);
  });

  afterEach(async () => {
    await mcpClient.close();
    await server.close();
  });

  it('calls register, unregister, and unregisterAll through MCP validation', async () => {
    const body = { Symbols: [{ Symbol: '7203', Exchange: 1 }] };

    await expect(
      mcpClient.callTool({ name: 'kabu_register', arguments: body }),
    ).resolves.toMatchObject({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });
    await expect(
      mcpClient.callTool({ name: 'kabu_unregister', arguments: body }),
    ).resolves.toMatchObject({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });
    await expect(
      mcpClient.callTool({ name: 'kabu_unregister_all', arguments: {} }),
    ).resolves.toMatchObject({ content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] });

    expect(fakeClient.register).toHaveBeenCalledWith(body);
    expect(fakeClient.unregister).toHaveBeenCalledWith(body);
    expect(fakeClient.unregisterAll).toHaveBeenCalledWith();

    const tools = await mcpClient.listTools();
    for (const tool of tools.tools) {
      expect(tool.description).toContain(
        'kabuステーションアプリ全体のPUSH配信購読状態を変更します',
      );
    }
  });

  it('rejects a registration body with a missing Symbol value', async () => {
    const result = await mcpClient.callTool({
      name: 'kabu_register',
      arguments: { Symbols: [{ Exchange: 1 }] },
    });

    expect(result.isError).toBe(true);
    expect(fakeClient.register).not.toHaveBeenCalled();
  });
});
