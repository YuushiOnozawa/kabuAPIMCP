import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HttpClient, HttpClientInit, HttpClientResult } from './httpClient.js';
import { createKabuApiClient, type KabuApiClient } from './kabuApiClient.js';
import type { RequestRegister, RequestUnregister } from './types.js';

const successResult: HttpClientResult<unknown> = {
  kind: 'success',
  status: 200,
  body: {},
};

type Fixture = {
  name: string;
  invoke: (client: KabuApiClient) => Promise<unknown>;
  path: string;
  init: HttpClientInit;
};

const registerBody: RequestRegister = {
  Symbols: [{ Symbol: '7203', Exchange: 1 }],
};

const unregisterBody: RequestUnregister = {
  Symbols: [{ Symbol: '7203', Exchange: 1 }],
};

const orderParams = {
  product: '1',
  id: 'order-1',
  updtime: '2026-08-17T12:34:56',
  details: 'true',
  symbol: '7203@1',
  state: '2',
  side: '1',
  cashmargin: '2',
};

const positionParams = {
  product: '1',
  symbol: '7203@1',
  side: '1',
  addinfo: 'true',
};

const fixtures: Fixture[] = [
  {
    name: 'getWalletCash',
    invoke: (client) => client.getWalletCash(),
    path: '/wallet/cash',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletCashBySymbol',
    invoke: (client) => client.getWalletCashBySymbol('7203@1'),
    path: '/wallet/cash/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletMargin',
    invoke: (client) => client.getWalletMargin(),
    path: '/wallet/margin',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletMarginBySymbol',
    invoke: (client) => client.getWalletMarginBySymbol('7203@1'),
    path: '/wallet/margin/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletFuture',
    invoke: (client) => client.getWalletFuture(),
    path: '/wallet/future',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletFutureBySymbol',
    invoke: (client) => client.getWalletFutureBySymbol('7203@1'),
    path: '/wallet/future/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletOption',
    invoke: (client) => client.getWalletOption(),
    path: '/wallet/option',
    init: { method: 'GET' },
  },
  {
    name: 'getWalletOptionBySymbol',
    invoke: (client) => client.getWalletOptionBySymbol('7203@1'),
    path: '/wallet/option/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getBoard',
    invoke: (client) => client.getBoard('7203@1'),
    path: '/board/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getSymbol',
    invoke: (client) => client.getSymbol('7203@1', 'true'),
    path: '/symbol/7203@1?addinfo=true',
    init: { method: 'GET' },
  },
  {
    name: 'getRanking',
    invoke: (client) => client.getRanking('1', 'ALL'),
    path: '/ranking?Type=1&ExchangeDivision=ALL',
    init: { method: 'GET' },
  },
  {
    name: 'getExchange',
    invoke: (client) => client.getExchange('usdjpy'),
    path: '/exchange/usdjpy',
    init: { method: 'GET' },
  },
  {
    name: 'getRegulations',
    invoke: (client) => client.getRegulations('7203@1'),
    path: '/regulations/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getPrimaryExchange',
    invoke: (client) => client.getPrimaryExchange('7203@1'),
    path: '/primaryexchange/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getTimeAndSales',
    invoke: (client) => client.getTimeAndSales('7203@1'),
    path: '/timeandsales/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getSymbolNameFuture',
    invoke: (client) => client.getSymbolNameFuture(202608, 'NK225'),
    path: '/symbolname/future?DerivMonth=202608&FutureCode=NK225',
    init: { method: 'GET' },
  },
  {
    name: 'getSymbolNameOption',
    invoke: (client) => client.getSymbolNameOption(202608, 'C', 30000, 'NK225op'),
    path: '/symbolname/option?DerivMonth=202608&PutOrCall=C&StrikePrice=30000&OptionCode=NK225op',
    init: { method: 'GET' },
  },
  {
    name: 'getSymbolNameMinioptionWeekly',
    invoke: (client) => client.getSymbolNameMinioptionWeekly(202608, 1, 'C', 30000),
    path: '/symbolname/minioptionweekly?DerivMonth=202608&DerivWeekly=1&PutOrCall=C&StrikePrice=30000',
    init: { method: 'GET' },
  },
  {
    name: 'getMarginPremium',
    invoke: (client) => client.getMarginPremium('7203@1'),
    path: '/margin/marginpremium/7203@1',
    init: { method: 'GET' },
  },
  {
    name: 'getOrders',
    invoke: (client) => client.getOrders(orderParams),
    path: '/orders?product=1&id=order-1&updtime=2026-08-17T12%3A34%3A56&details=true&symbol=7203%401&state=2&side=1&cashmargin=2',
    init: { method: 'GET' },
  },
  {
    name: 'getPositions',
    invoke: (client) => client.getPositions(positionParams),
    path: '/positions?product=1&symbol=7203%401&side=1&addinfo=true',
    init: { method: 'GET' },
  },
  {
    name: 'getApiSoftLimit',
    invoke: (client) => client.getApiSoftLimit(),
    path: '/apisoftlimit',
    init: { method: 'GET' },
  },
  {
    name: 'register',
    invoke: (client) => client.register(registerBody),
    path: '/register',
    init: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerBody),
    },
  },
  {
    name: 'unregister',
    invoke: (client) => client.unregister(unregisterBody),
    path: '/unregister',
    init: {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unregisterBody),
    },
  },
  {
    name: 'unregisterAll',
    invoke: (client) => client.unregisterAll(),
    path: '/unregister/all',
    init: { method: 'PUT' },
  },
];

function createClientMock() {
  const request = vi.fn().mockResolvedValue(successResult);
  const httpClient = { request } as unknown as HttpClient;
  return { client: createKabuApiClient(httpClient), request };
}

describe('createKabuApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(fixtures)('$name calls HttpClient with the expected request', async (fixture) => {
    const { client, request } = createClientMock();

    await fixture.invoke(client);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(fixture.path, fixture.init);
  });

  it('passes through success, httpError, and tokenError results', async () => {
    const { client, request } = createClientMock();
    const results: Array<HttpClientResult<unknown>> = [
      { kind: 'success', status: 200, body: { ok: true } },
      { kind: 'httpError', status: 500, body: { message: 'failed' } },
      { kind: 'tokenError', tokenResult: { kind: 'network', message: 'unavailable' } },
    ];

    for (const result of results) {
      request.mockResolvedValueOnce(result);
      await expect(client.getWalletCash()).resolves.toBe(result);
    }
  });

  it('omits unspecified optional query parameters', async () => {
    const { client, request } = createClientMock();

    await client.getSymbol('7203@1');
    expect(request).toHaveBeenLastCalledWith('/symbol/7203@1', { method: 'GET' });

    await client.getSymbolNameFuture(202608);
    expect(request).toHaveBeenLastCalledWith('/symbolname/future?DerivMonth=202608', {
      method: 'GET',
    });

    await client.getSymbolNameOption(202608, '2', 30000);
    expect(request).toHaveBeenLastCalledWith(
      '/symbolname/option?DerivMonth=202608&PutOrCall=2&StrikePrice=30000',
      { method: 'GET' },
    );

    await client.getOrders({ product: '1' });
    expect(request).toHaveBeenLastCalledWith('/orders?product=1', { method: 'GET' });

    await client.getPositions();
    expect(request).toHaveBeenLastCalledWith('/positions', { method: 'GET' });
  });
});
