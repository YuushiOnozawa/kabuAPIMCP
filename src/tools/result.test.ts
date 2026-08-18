import { describe, expect, it } from 'vitest';

import type { HttpClientResult } from '../client/httpClient.js';
import { toToolResult } from './result.js';

describe('toToolResult', () => {
  it.each([
    {
      name: 'success',
      result: { kind: 'success', status: 200, body: { ok: true } },
      expected: {
        content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
      },
    },
    {
      name: 'httpError',
      result: { kind: 'httpError', status: 500, body: { message: 'failed' } },
      expected: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ kind: 'httpError', status: 500, body: { message: 'failed' } }),
          },
        ],
        isError: true,
      },
    },
    {
      name: 'network',
      result: { kind: 'network', message: 'unavailable' },
      expected: {
        content: [
          { type: 'text', text: JSON.stringify({ kind: 'network', message: 'unavailable' }) },
        ],
        isError: true,
      },
    },
    {
      name: 'timeout',
      result: { kind: 'timeout', timeoutMs: 1000 },
      expected: {
        content: [{ type: 'text', text: JSON.stringify({ kind: 'timeout', timeoutMs: 1000 }) }],
        isError: true,
      },
    },
    {
      name: 'parseFailure',
      result: { kind: 'parseFailure', status: 200, rawBody: '{' },
      expected: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ kind: 'parseFailure', status: 200, rawBody: '{' }),
          },
        ],
        isError: true,
      },
    },
    {
      name: 'tokenError',
      result: { kind: 'tokenError', tokenResult: { kind: 'apiError', resultCode: 401 } },
      expected: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              kind: 'tokenError',
              tokenResult: { kind: 'apiError', resultCode: 401 },
            }),
          },
        ],
        isError: true,
      },
    },
  ])('$name is converted to a CallToolResult', ({ result, expected }) => {
    expect(toToolResult(result as HttpClientResult<unknown>)).toEqual(expected);
  });

  it('serializes an undefined success body as null', () => {
    expect(
      toToolResult({ kind: 'success', status: 204, body: undefined } as HttpClientResult<unknown>),
    ).toEqual({ content: [{ type: 'text', text: 'null' }] });
  });
});
