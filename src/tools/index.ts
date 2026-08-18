import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { KabuApiClient } from '../client/kabuApiClient.js';
import { registerAccountTools } from './account.js';
import { registerMarketTools } from './market.js';
import { registerMasterTools } from './master.js';
import { registerRegisterTools } from './register.js';
import { registerWalletTools } from './wallet.js';

export function registerAllTools(server: McpServer, client: KabuApiClient): void {
  registerWalletTools(server, client);
  registerMarketTools(server, client);
  registerMasterTools(server, client);
  registerAccountTools(server, client);
  registerRegisterTools(server, client);
}
