import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTokenManager } from './tokenManager.js';

function mockResponse(status: number, body: unknown): Response {
  return {
    status,
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('createTokenManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('初回getTokenで/tokenへPOSTし、成功したトークンを返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { ResultCode: 0, Token: 'xxx' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'https://example.test/kabusapi/',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'success', token: 'xxx' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.test/kabusapi/token');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.body).toBe(JSON.stringify({ APIPassword: 'secret' }));
  });

  it('2回目以降のgetTokenではキャッシュを返し、fetchしない', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse(200, { ResultCode: 0, Token: 'cached' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'success', token: 'cached' });
    await expect(manager.getToken()).resolves.toEqual({ kind: 'success', token: 'cached' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('同時に複数のgetTokenを呼んでもfetchは1回だけで同じ結果を共有する', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    const results = [manager.getToken(), manager.getToken(), manager.getToken()];
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFetch(mockResponse(200, { ResultCode: 0, Token: 'shared' }));

    await expect(Promise.all(results)).resolves.toEqual([
      { kind: 'success', token: 'shared' },
      { kind: 'success', token: 'shared' },
      { kind: 'success', token: 'shared' },
    ]);
  });

  it('ResultCodeが0以外ならapiErrorを返し、キャッシュしない', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(200, { ResultCode: 1, Token: 'ignored' }))
      .mockResolvedValueOnce(mockResponse(200, { ResultCode: 0, Token: 'next' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'apiError', resultCode: 1 });
    await expect(manager.getToken()).resolves.toEqual({ kind: 'success', token: 'next' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('HTTPエラーをstatusとbody付きで返す', async () => {
    const body = { Message: 'unauthorized' };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(401, body));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'httpError', status: 401, body });
  });

  it('ネットワークエラーをmessage付きで返す', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({
      kind: 'network',
      message: 'connection refused',
    });
  });

  it('transport層のタイムアウトをtimeoutMs付きで返す', async () => {
    const timeoutError = new Error('request timed out');
    timeoutError.name = 'TimeoutError';
    const fetchMock = vi.fn().mockRejectedValue(timeoutError);
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'timeout', timeoutMs: 10_000 });
  });

  it('成功レスポンスのTokenが空文字列ならparseFailureを返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, { ResultCode: 0, Token: '' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'parseFailure' });
  });

  it.each([null, { ResultCode: '0' }])(
    '成功レスポンスのbodyまたはResultCodeが不正ならparseFailureを返す',
    async (body) => {
      const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, body));
      vi.stubGlobal('fetch', fetchMock);
      const manager = createTokenManager({
        apiPassword: 'secret',
        baseUrl: 'http://example.test/kabusapi',
      });

      await expect(manager.getToken()).resolves.toEqual({ kind: 'parseFailure' });
    },
  );

  it('transport層のJSONパース失敗をparseFailureとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: vi.fn().mockResolvedValue('{invalid json'),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({ kind: 'parseFailure' });
  });

  it('キャッシュとstaleTokenが一致するinvalidateTokenでは新規取得する', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(200, { ResultCode: 0, Token: 'old' }))
      .mockResolvedValueOnce(mockResponse(200, { ResultCode: 0, Token: 'new' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await manager.getToken();
    await expect(manager.invalidateToken('old')).resolves.toEqual({
      kind: 'success',
      token: 'new',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('staleTokenが現在のキャッシュと不一致なら現在のトークンを返す', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse(200, { ResultCode: 0, Token: 'current' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await manager.getToken();
    await expect(manager.invalidateToken('stale')).resolves.toEqual({
      kind: 'success',
      token: 'current',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('同じstaleTokenのinvalidateTokenを同時に呼んでもfetchは1回だけ', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(200, { ResultCode: 0, Token: 'old' }))
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await manager.getToken();
    const first = manager.invalidateToken('old');
    const second = manager.invalidateToken('old');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    resolveFetch(mockResponse(200, { ResultCode: 0, Token: 'refreshed' }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { kind: 'success', token: 'refreshed' },
      { kind: 'success', token: 'refreshed' },
    ]);
  });

  it('取得失敗後の次回getTokenでは再度fetchする', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(mockResponse(200, { ResultCode: 0, Token: 'recovered' }));
    vi.stubGlobal('fetch', fetchMock);
    const manager = createTokenManager({
      apiPassword: 'secret',
      baseUrl: 'http://example.test/kabusapi',
    });

    await expect(manager.getToken()).resolves.toEqual({
      kind: 'network',
      message: 'temporary failure',
    });
    await expect(manager.getToken()).resolves.toEqual({ kind: 'success', token: 'recovered' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
