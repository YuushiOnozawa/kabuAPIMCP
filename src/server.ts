import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { KabuConfig } from './config.js';
import { createHttpClient } from './client/httpClient.js';
import { createKabuApiClient } from './client/kabuApiClient.js';
import { createTokenManager } from './client/tokenManager.js';
import { registerAllTools } from './tools/index.js';

export function createServer(config: KabuConfig): McpServer {
  const tokenManager = createTokenManager(config);
  const httpClient = createHttpClient(config, tokenManager);
  const client = createKabuApiClient(httpClient);
  const server = new McpServer({ name: 'kabu-station-mcp', version: '0.1.0' });

  registerAllTools(server, client);

  return server;
}
