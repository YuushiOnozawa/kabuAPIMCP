import { afterEach, describe, expect, it, vi } from 'vitest';

import type { KabuConfig } from '../config.js';
import { createHttpClient } from './httpClient.js';
import type { TokenManager, TokenResult } from './tokenManager.js';

function mockResponse(status: number, body: unknown): Response {
  return {
    status,
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

function createConfig(baseUrl = 'https://example.test/kabusapi'): KabuConfig {
  return { apiPassword: 'secret', baseUrl };
}

function createTokenManager(tokenResult: TokenResult): TokenManager {
  return {
    getToken: vi.fn().mockResolvedValue(tokenResult),
    invalidateToken: vi.fn(),
  };
}

describe('createHttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('トークン取得成功時、APIキー付きでリクエストし成功結果を返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { message: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager = createTokenManager({ kind: 'success', token: 'token-1' });
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(
      client.request<{ message: string }>('/wallet/cash', {
        method: 'GET',
        headers: { Accept: 'application/json', 'X-API-KEY': 'caller-token' },
        body: JSON.stringify({ order: 'cash' }),
        timeoutMs: 250,
      }),
    ).resolves.toEqual({ kind: 'success', status: 200, body: { message: 'ok' } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.test/kabusapi/wallet/cash');
    expect(requestInit).toMatchObject({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-API-KEY': 'token-1' },
      body: JSON.stringify({ order: 'cash' }),
    });
  });

  it('トークン取得失敗時はtokenErrorを返し、APIリクエストを送らない', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const tokenResult: TokenResult = { kind: 'network', message: 'token server unavailable' };
    const client = createHttpClient(createConfig(), createTokenManager(tokenResult));

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'tokenError',
      tokenResult,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('401時にトークンを無効化できれば新トークンで1回だけリトライする', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(mockResponse(200, { message: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);
    const invalidateToken = vi.fn().mockResolvedValue({ kind: 'success', token: 'token-2' });
    const tokenManager: TokenManager = {
      getToken: vi.fn().mockResolvedValue({ kind: 'success', token: 'token-1' }),
      invalidateToken,
    };
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'success',
      status: 200,
      body: { message: 'ok' },
    });

    expect(invalidateToken).toHaveBeenCalledWith('token-1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual({
      'X-API-KEY': 'token-1',
    });
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toEqual({
      'X-API-KEY': 'token-2',
    });
  });

  it('401時のトークン再発行失敗はtokenErrorを返し、リトライしない', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(401, { message: 'expired' }));
    vi.stubGlobal('fetch', fetchMock);
    const tokenResult: TokenResult = { kind: 'timeout', timeoutMs: 500 };
    const invalidateToken = vi.fn().mockResolvedValue(tokenResult);
    const tokenManager: TokenManager = {
      getToken: vi.fn().mockResolvedValue({ kind: 'success', token: 'token-1' }),
      invalidateToken,
    };
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'tokenError',
      tokenResult,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(invalidateToken).toHaveBeenCalledWith('token-1');
  });

  it('401以外のhttpErrorはリトライせずそのまま返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(500, { message: 'failed' }));
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager = createTokenManager({ kind: 'success', token: 'token-1' });
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'httpError',
      status: 500,
      body: { message: 'failed' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(tokenManager.invalidateToken).not.toHaveBeenCalled();
  });

  it('network結果はリトライせずそのまま返す', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager = createTokenManager({ kind: 'success', token: 'token-1' });
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'network',
      message: 'connection refused',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('timeout結果はリトライせずそのまま返す', async () => {
    const timeoutError = new Error('request timed out');
    timeoutError.name = 'TimeoutError';
    const fetchMock = vi.fn().mockRejectedValue(timeoutError);
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager = createTokenManager({ kind: 'success', token: 'token-1' });
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash', { timeoutMs: 250 })).resolves.toEqual({
      kind: 'timeout',
      timeoutMs: 250,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('parseFailure結果はリトライせずそのまま返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, '{invalid json'));
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager = createTokenManager({ kind: 'success', token: 'token-1' });
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'parseFailure',
      status: 200,
      rawBody: '{invalid json',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('リトライ後も401なら3回目を送らず2回目の結果を返す', async () => {
    const secondUnauthorized = mockResponse(401, { message: 'still expired' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(secondUnauthorized);
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager: TokenManager = {
      getToken: vi.fn().mockResolvedValue({ kind: 'success', token: 'token-1' }),
      invalidateToken: vi.fn().mockResolvedValue({ kind: 'success', token: 'token-2' }),
    };
    const client = createHttpClient(createConfig(), tokenManager);

    await expect(client.request('/wallet/cash')).resolves.toEqual({
      kind: 'httpError',
      status: 401,
      body: { message: 'still expired' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(['https://example.test/kabusapi', 'https://example.test/kabusapi/'])(
    'baseUrl末尾スラッシュを正規化してURLを組み立てる: %s',
    async (baseUrl) => {
      const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { ok: true }));
      vi.stubGlobal('fetch', fetchMock);
      const client = createHttpClient(
        createConfig(baseUrl),
        createTokenManager({ kind: 'success', token: 'token-1' }),
      );

      await client.request('/wallet/cash');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.test/kabusapi/wallet/cash',
        expect.any(Object),
      );
    },
  );

  it('呼び出し元のinitオブジェクトを変更しない', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const tokenManager = createTokenManager({ kind: 'success', token: 'token-1' });
    const client = createHttpClient(createConfig(), tokenManager);
    const init = {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({ amount: 100 }),
      timeoutMs: 500,
    };
    const originalInit = { ...init, headers: { ...init.headers } };

    await client.request('/wallet/cash', init);

    expect(init).toEqual(originalInit);
    expect(init.headers).not.toHaveProperty('X-API-KEY');
  });
});
