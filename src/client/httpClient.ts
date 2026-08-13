import type { KabuConfig } from '../config.js';
import { requestJson, type TransportResult } from './transport.js';
import type { TokenManager, TokenResult } from './tokenManager.js';

/**
 * 401は認証層でリクエストが拒否され、業務ロジック（副作用を含む）は実行されていないという
 * 一般的なREST API認証パターンを前提としてリトライする。
 */

export type HttpClientInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

export type HttpClientResult<T> =
  | TransportResult<T>
  | { kind: 'tokenError'; tokenResult: Exclude<TokenResult, { kind: 'success' }> };

export type HttpClient = {
  request: <T>(path: string, init?: HttpClientInit) => Promise<HttpClientResult<T>>;
};

function isTokenSuccess(result: TokenResult): result is Extract<TokenResult, { kind: 'success' }> {
  return result.kind === 'success';
}

export function createHttpClient(config: KabuConfig, tokenManager: TokenManager): HttpClient {
  const buildUrl = (path: string): string => `${config.baseUrl.replace(/\/$/, '')}${path}`;

  const requestWithToken = <T>(
    url: string,
    token: string,
    init: HttpClientInit | undefined,
  ): Promise<TransportResult<T>> =>
    requestJson<T>(url, {
      method: init?.method,
      headers: { ...init?.headers, 'X-API-KEY': token },
      body: init?.body,
      timeoutMs: init?.timeoutMs,
    });

  const request = async <T>(path: string, init?: HttpClientInit): Promise<HttpClientResult<T>> => {
    const tokenResult = await tokenManager.getToken();

    if (!isTokenSuccess(tokenResult)) {
      return { kind: 'tokenError', tokenResult };
    }

    const url = buildUrl(path);
    const result = await requestWithToken<T>(url, tokenResult.token, init);

    if (result.kind !== 'httpError' || result.status !== 401) {
      return result;
    }

    const refreshedTokenResult = await tokenManager.invalidateToken(tokenResult.token);

    if (!isTokenSuccess(refreshedTokenResult)) {
      return { kind: 'tokenError', tokenResult: refreshedTokenResult };
    }

    return requestWithToken<T>(url, refreshedTokenResult.token, init);
  };

  return { request };
}
