import type { KabuConfig } from '../config.js';
import { requestJson, type TransportResult } from './transport.js';

/**
 * TokenManagerはプロセス内で1回だけ生成し、使い回す前提です。
 * 各インスタンスはキャッシュとsingle-flight用Promiseを1組だけ保持します。
 */

export type TokenResult =
  | { kind: 'success'; token: string }
  | { kind: 'apiError'; resultCode: number }
  | { kind: 'httpError'; status: number; body: unknown }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'parseFailure' };

export type TokenManager = {
  getToken: () => Promise<TokenResult>;
  invalidateToken: (staleToken: string) => Promise<TokenResult>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toTokenResult(result: TransportResult<unknown>): TokenResult {
  switch (result.kind) {
    case 'success': {
      if (!isRecord(result.body) || typeof result.body.ResultCode !== 'number') {
        return { kind: 'parseFailure' };
      }

      if (result.body.ResultCode !== 0) {
        return { kind: 'apiError', resultCode: result.body.ResultCode };
      }

      if (typeof result.body.Token !== 'string' || result.body.Token.length === 0) {
        return { kind: 'parseFailure' };
      }

      return { kind: 'success', token: result.body.Token };
    }
    case 'httpError':
      return { kind: 'httpError', status: result.status, body: result.body };
    case 'network':
      return { kind: 'network', message: result.message };
    case 'timeout':
      return { kind: 'timeout', timeoutMs: result.timeoutMs };
    case 'parseFailure':
      return { kind: 'parseFailure' };
  }
}

export function createTokenManager(config: KabuConfig): TokenManager {
  const tokenUrl = `${config.baseUrl.replace(/\/$/, '')}/token`;
  let cachedToken: string | null = null;
  let inFlight: Promise<TokenResult> | null = null;

  const requestToken = (): Promise<TokenResult> =>
    requestJson<unknown>(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ APIPassword: config.apiPassword }),
    }).then((result) => {
      const tokenResult = toTokenResult(result);

      if (tokenResult.kind === 'success') {
        cachedToken = tokenResult.token;
      }

      return tokenResult;
    });

  const getToken = (): Promise<TokenResult> => {
    if (cachedToken !== null) {
      return Promise.resolve({ kind: 'success', token: cachedToken });
    }

    if (inFlight !== null) {
      return inFlight;
    }

    const request = requestToken();
    inFlight = request;
    const clearInFlight = (): void => {
      inFlight = null;
    };
    void request.then(clearInFlight, clearInFlight);

    return request;
  };

  const invalidateToken = (staleToken: string): Promise<TokenResult> => {
    if (cachedToken === staleToken) {
      cachedToken = null;
    }

    return getToken();
  };

  return { getToken, invalidateToken };
}
