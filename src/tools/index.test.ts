import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, describe, expect, it } from 'vitest';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerAllTools } from './index.js';

const expectedToolNames = [
  'kabu_get_wallet_cash',
  'kabu_get_wallet_cash_by_symbol',
  'kabu_get_wallet_margin',
  'kabu_get_wallet_margin_by_symbol',
  'kabu_get_wallet_future',
  'kabu_get_wallet_future_by_symbol',
  'kabu_get_wallet_option',
  'kabu_get_wallet_option_by_symbol',
  'kabu_get_board',
  'kabu_get_symbol',
  'kabu_get_ranking',
  'kabu_get_exchange',
  'kabu_get_regulations',
  'kabu_get_primary_exchange',
  'kabu_get_time_and_sales',
  'kabu_get_symbol_name_future',
  'kabu_get_symbol_name_option',
  'kabu_get_symbol_name_minioption_weekly',
  'kabu_get_margin_premium',
  'kabu_get_orders',
  'kabu_get_positions',
  'kabu_get_api_soft_limit',
  'kabu_register',
  'kabu_unregister',
  'kabu_unregister_all',
];

let server: McpServer;
let mcpClient: Client;

describe('registerAllTools', () => {
  afterEach(async () => {
    await mcpClient.close();
    await server.close();
  });

  it('registers all 25 tools on a real MCP server', async () => {
    server = new McpServer({ name: 'index-test-server', version: '1.0.0' });
    registerAllTools(server, {} as KabuApiClient);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: 'index-test-client', version: '1.0.0' });
    await server.connect(serverTransport);
    await mcpClient.connect(clientTransport);

    const result = await mcpClient.listTools();

    expect(result.tools).toHaveLength(25);
    expect(result.tools.map(({ name }) => name).sort()).toEqual([...expectedToolNames].sort());
  });

  it('keeps order execution tools out of the production tool sources', async () => {
    const productionFiles = [
      'result.ts',
      'wallet.ts',
      'market.ts',
      'master.ts',
      'account.ts',
      'register.ts',
      'index.ts',
    ];

    for (const file of productionFiles) {
      const source = await readFile(resolve(process.cwd(), 'src/tools', file), 'utf8');
      expect(source).not.toContain('sendorder');
      expect(source).not.toContain('cancelorder');
    }
  });
});
