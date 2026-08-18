import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import type { HttpClientResult } from '../client/httpClient.js';

export function toToolResult<T>(result: HttpClientResult<T>): CallToolResult {
  if (result.kind === 'success') {
    return {
      content: [{ type: 'text', text: JSON.stringify(result.body ?? null) }],
    };
  }

  const { kind, ...details } = result;

  return {
    content: [{ type: 'text', text: JSON.stringify({ kind, ...details }) }],
    isError: true,
  };
}
