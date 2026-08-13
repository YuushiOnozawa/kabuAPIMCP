import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestJson } from './transport.js';

function mockResponse(status: number, body: string): Response {
  return {
    status,
    text: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('requestJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('2xxレスポンスのJSONボディをsuccessとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, '{"message":"ok"}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson<{ message: string }>('http://example.test/data')).resolves.toEqual({
      kind: 'success',
      status: 200,
      body: { message: 'ok' },
    });
  });

  it('4xx/5xxレスポンスをJSONボディ付きのhttpErrorとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(500, '{"error":"failed"}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data')).resolves.toEqual({
      kind: 'httpError',
      status: 500,
      body: { error: 'failed' },
    });
  });

  it('fetchのネットワーク例外をnetworkとして返す', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('connection refused'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data')).resolves.toEqual({
      kind: 'network',
      message: 'connection refused',
    });
  });

  it('TimeoutErrorをtimeoutとして返す', async () => {
    const timeoutError = new Error('request timed out');
    timeoutError.name = 'TimeoutError';
    const fetchMock = vi.fn().mockRejectedValue(timeoutError);
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data', { timeoutMs: 250 })).resolves.toEqual({
      kind: 'timeout',
      timeoutMs: 250,
    });
  });

  it('2xxレスポンスの不正なJSONをparseFailureとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, '{invalid json'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data')).resolves.toEqual({
      kind: 'parseFailure',
      status: 200,
      rawBody: '{invalid json',
    });
  });

  it('2xxレスポンスのボディ読み取り失敗をparseFailureとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: vi.fn().mockRejectedValue(new Error('body read failed')),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data')).resolves.toEqual({
      kind: 'parseFailure',
      status: 200,
      rawBody: 'body read failed',
    });
  });

  it('204 No Contentなど空ボディをbody undefinedのsuccessとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(204, ''));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data')).resolves.toEqual({
      kind: 'success',
      status: 204,
      body: undefined,
    });
  });

  it('非2xxレスポンスの不正なJSONを生テキスト付きhttpErrorとして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(404, 'not json'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestJson('http://example.test/data')).resolves.toEqual({
      kind: 'httpError',
      status: 404,
      body: 'not json',
    });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'timeoutMs=%sでも既定値へフォールバックして成功する',
    async (timeoutMs) => {
      const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, '{"ok":true}'));
      vi.stubGlobal('fetch', fetchMock);

      await expect(requestJson('http://example.test/data', { timeoutMs })).resolves.toEqual({
        kind: 'success',
        status: 200,
        body: { ok: true },
      });
    },
  );

  it('呼び出し側のsignalを無視し、timeoutMsをfetchへ渡さない', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, '{"ok":true}'));
    vi.stubGlobal('fetch', fetchMock);
    const callerSignal = AbortSignal.abort();

    await requestJson('http://example.test/data', {
      signal: callerSignal,
      timeoutMs: 250,
    });

    const [, passedInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(passedInit.signal).toBeInstanceOf(AbortSignal);
    expect(passedInit.signal).not.toBe(callerSignal);
    expect(passedInit).not.toHaveProperty('timeoutMs');
  });
});
