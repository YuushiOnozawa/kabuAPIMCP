import type { HttpClient, HttpClientInit, HttpClientResult } from './httpClient.js';
import type {
  ApiSoftLimitResponse,
  BoardSuccess,
  ExchangeCurrency,
  ExchangeResponse,
  MarginPremiumResponse,
  OrdersSuccess,
  PositionsSuccess,
  PrimaryExchangeResponse,
  RankingResponse,
  RegistSuccess,
  RegulationsResponse,
  RequestRegister,
  RequestUnregister,
  SymbolNameSuccess,
  SymbolSuccess,
  TimeAndSalesResponse,
  UnregisterAllSuccess,
  WalletCashSuccess,
  WalletFutureSuccess,
  WalletMarginSuccess,
  WalletOptionSuccess,
} from './types.js';

type QueryValue = string | number | undefined;

export type KabuApiClient = {
  getWalletCash: () => Promise<HttpClientResult<WalletCashSuccess>>;
  getWalletCashBySymbol: (symbol: string) => Promise<HttpClientResult<WalletCashSuccess>>;
  getWalletMargin: () => Promise<HttpClientResult<WalletMarginSuccess>>;
  getWalletMarginBySymbol: (symbol: string) => Promise<HttpClientResult<WalletMarginSuccess>>;
  getWalletFuture: () => Promise<HttpClientResult<WalletFutureSuccess>>;
  getWalletFutureBySymbol: (symbol: string) => Promise<HttpClientResult<WalletFutureSuccess>>;
  getWalletOption: () => Promise<HttpClientResult<WalletOptionSuccess>>;
  getWalletOptionBySymbol: (symbol: string) => Promise<HttpClientResult<WalletOptionSuccess>>;
  getBoard: (symbol: string) => Promise<HttpClientResult<BoardSuccess>>;
  getSymbol: (symbol: string, addinfo?: string) => Promise<HttpClientResult<SymbolSuccess>>;
  getRanking: (
    type: string,
    exchangeDivision: string,
  ) => Promise<HttpClientResult<RankingResponse>>;
  getExchange: (currency: ExchangeCurrency) => Promise<HttpClientResult<ExchangeResponse>>;
  getRegulations: (symbol: string) => Promise<HttpClientResult<RegulationsResponse>>;
  getPrimaryExchange: (symbol: string) => Promise<HttpClientResult<PrimaryExchangeResponse>>;
  getTimeAndSales: (symbol: string) => Promise<HttpClientResult<TimeAndSalesResponse>>;
  getSymbolNameFuture: (
    derivMonth: number,
    futureCode?: string,
  ) => Promise<HttpClientResult<SymbolNameSuccess>>;
  getSymbolNameOption: (
    derivMonth: number,
    putOrCall: string,
    strikePrice: number,
    optionCode?: string,
  ) => Promise<HttpClientResult<SymbolNameSuccess>>;
  getSymbolNameMinioptionWeekly: (
    derivMonth: number,
    derivWeekly: number,
    putOrCall: string,
    strikePrice: number,
  ) => Promise<HttpClientResult<SymbolNameSuccess>>;
  getMarginPremium: (symbol: string) => Promise<HttpClientResult<MarginPremiumResponse>>;
  getOrders: (params?: {
    product?: string;
    id?: string;
    updtime?: string;
    details?: string;
    symbol?: string;
    state?: string;
    side?: string;
    cashmargin?: string;
  }) => Promise<HttpClientResult<OrdersSuccess[]>>;
  getPositions: (params?: {
    product?: string;
    symbol?: string;
    side?: string;
    addinfo?: string;
  }) => Promise<HttpClientResult<PositionsSuccess[]>>;
  getApiSoftLimit: () => Promise<HttpClientResult<ApiSoftLimitResponse>>;
  register: (body: RequestRegister) => Promise<HttpClientResult<RegistSuccess>>;
  unregister: (body: RequestUnregister) => Promise<HttpClientResult<RegistSuccess>>;
  unregisterAll: () => Promise<HttpClientResult<UnregisterAllSuccess>>;
};

function withQuery(path: string, params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query === '' ? path : `${path}?${query}`;
}

export function createKabuApiClient(httpClient: HttpClient): KabuApiClient {
  const request = <T>(path: string, init: HttpClientInit): Promise<HttpClientResult<T>> =>
    httpClient.request<T>(path, init);

  return {
    getWalletCash: () => request<WalletCashSuccess>('/wallet/cash', { method: 'GET' }),
    getWalletCashBySymbol: (symbol) =>
      request<WalletCashSuccess>(`/wallet/cash/${symbol}`, { method: 'GET' }),
    getWalletMargin: () => request<WalletMarginSuccess>('/wallet/margin', { method: 'GET' }),
    getWalletMarginBySymbol: (symbol) =>
      request<WalletMarginSuccess>(`/wallet/margin/${symbol}`, { method: 'GET' }),
    getWalletFuture: () => request<WalletFutureSuccess>('/wallet/future', { method: 'GET' }),
    getWalletFutureBySymbol: (symbol) =>
      request<WalletFutureSuccess>(`/wallet/future/${symbol}`, { method: 'GET' }),
    getWalletOption: () => request<WalletOptionSuccess>('/wallet/option', { method: 'GET' }),
    getWalletOptionBySymbol: (symbol) =>
      request<WalletOptionSuccess>(`/wallet/option/${symbol}`, { method: 'GET' }),
    getBoard: (symbol) => request<BoardSuccess>(`/board/${symbol}`, { method: 'GET' }),
    getSymbol: (symbol, addinfo) =>
      request<SymbolSuccess>(withQuery(`/symbol/${symbol}`, { addinfo }), { method: 'GET' }),
    getRanking: (type, exchangeDivision) =>
      request<RankingResponse>(
        withQuery('/ranking', { Type: type, ExchangeDivision: exchangeDivision }),
        { method: 'GET' },
      ),
    getExchange: (currency) =>
      request<ExchangeResponse>(`/exchange/${currency}`, { method: 'GET' }),
    getRegulations: (symbol) =>
      request<RegulationsResponse>(`/regulations/${symbol}`, { method: 'GET' }),
    getPrimaryExchange: (symbol) =>
      request<PrimaryExchangeResponse>(`/primaryexchange/${symbol}`, { method: 'GET' }),
    getTimeAndSales: (symbol) =>
      request<TimeAndSalesResponse>(`/timeandsales/${symbol}`, { method: 'GET' }),
    getSymbolNameFuture: (derivMonth, futureCode) =>
      request<SymbolNameSuccess>(
        withQuery('/symbolname/future', { DerivMonth: derivMonth, FutureCode: futureCode }),
        { method: 'GET' },
      ),
    getSymbolNameOption: (derivMonth, putOrCall, strikePrice, optionCode) =>
      request<SymbolNameSuccess>(
        withQuery('/symbolname/option', {
          DerivMonth: derivMonth,
          PutOrCall: putOrCall,
          StrikePrice: strikePrice,
          OptionCode: optionCode,
        }),
        { method: 'GET' },
      ),
    getSymbolNameMinioptionWeekly: (derivMonth, derivWeekly, putOrCall, strikePrice) =>
      request<SymbolNameSuccess>(
        withQuery('/symbolname/minioptionweekly', {
          DerivMonth: derivMonth,
          DerivWeekly: derivWeekly,
          PutOrCall: putOrCall,
          StrikePrice: strikePrice,
        }),
        { method: 'GET' },
      ),
    getMarginPremium: (symbol) =>
      request<MarginPremiumResponse>(`/margin/marginpremium/${symbol}`, { method: 'GET' }),
    getOrders: (params) =>
      request<OrdersSuccess[]>(withQuery('/orders', params ?? {}), { method: 'GET' }),
    getPositions: (params) =>
      request<PositionsSuccess[]>(withQuery('/positions', params ?? {}), { method: 'GET' }),
    getApiSoftLimit: () => request<ApiSoftLimitResponse>('/apisoftlimit', { method: 'GET' }),
    register: (body) =>
      request<RegistSuccess>('/register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    unregister: (body) =>
      request<RegistSuccess>('/unregister', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    unregisterAll: () => request<UnregisterAllSuccess>('/unregister/all', { method: 'PUT' }),
  };
}
