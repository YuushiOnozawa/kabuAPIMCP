export type WalletCashSuccess = {
  StockAccountWallet: number;
  AuKCStockAccountWallet: number;
  AuJbnStockAccountWallet: number;
};

export type WalletMarginSuccess = {
  MarginAccountWallet: number;
  DepositkeepRate: number;
  ConsignmentDepositRate: number;
  CashOfConsignmentDepositRate: number;
  MaximumSellOpenAmountPerSymbol: number;
  MaximumBuyOpenAmountPerSymbol: number;
};

export type WalletFutureSuccess = {
  FutureTradeLimit: number;
  MarginRequirement: number;
  MarginRequirementSell: number;
};

export type WalletOptionSuccess = {
  OptionBuyTradeLimit: number;
  OptionSellTradeLimit: number;
  MarginRequirement: number;
};

export type BoardSuccess = {
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  CurrentPrice: number;
  CurrentPriceTime: string;
  CurrentPriceChangeStatus: string;
  CurrentPriceStatus: number;
  CalcPrice: number;
  PreviousClose: number;
  PreviousCloseTime: string;
  ChangePreviousClose: number;
  ChangePreviousClosePer: number;
  OpeningPrice: number;
  OpeningPriceTime: string;
  HighPrice: number;
  HighPriceTime: string;
  LowPrice: number;
  LowPriceTime: string;
  TradingVolume: number;
  TradingVolumeTime: string;
  VWAP: number;
  TradingValue: number;
  BidQty: number;
  BidPrice: number;
  BidTime: string;
  BidSign: string;
  MarketOrderSellQty: number;
  Sell1: {
    Time: string;
    Sign: string;
    Price: number;
    Qty: number;
  };
  Sell2: {
    Price: number;
    Qty: number;
  };
  Sell3: {
    Price: number;
    Qty: number;
  };
  Sell4: {
    Price: number;
    Qty: number;
  };
  Sell5: {
    Price: number;
    Qty: number;
  };
  Sell6: {
    Price: number;
    Qty: number;
  };
  Sell7: {
    Price: number;
    Qty: number;
  };
  Sell8: {
    Price: number;
    Qty: number;
  };
  Sell9: {
    Price: number;
    Qty: number;
  };
  Sell10: {
    Price: number;
    Qty: number;
  };
  AskQty: number;
  AskPrice: number;
  AskTime: string;
  AskSign: string;
  MarketOrderBuyQty: number;
  Buy1: {
    Time: string;
    Sign: string;
    Price: number;
    Qty: number;
  };
  Buy2: {
    Price: number;
    Qty: number;
  };
  Buy3: {
    Price: number;
    Qty: number;
  };
  Buy4: {
    Price: number;
    Qty: number;
  };
  Buy5: {
    Price: number;
    Qty: number;
  };
  Buy6: {
    Price: number;
    Qty: number;
  };
  Buy7: {
    Price: number;
    Qty: number;
  };
  Buy8: {
    Price: number;
    Qty: number;
  };
  Buy9: {
    Price: number;
    Qty: number;
  };
  Buy10: {
    Price: number;
    Qty: number;
  };
  OverSellQty: number;
  UnderBuyQty: number;
  TotalMarketValue: number;
  ClearingPrice: number;
  IV: number;
  Gamma: number;
  Theta: number;
  Vega: number;
  Delta: number;
  SecurityType: number;
};

export type SymbolSuccess = {
  Symbol: string;
  SymbolName: string;
  DisplayName: string;
  Exchange: number;
  ExchangeName: string;
  BisCategory: string;
  TotalMarketValue: number;
  TotalStocks: number;
  TradingUnit: number;
  FiscalYearEndBasic: number;
  PriceRangeGroup: string;
  KCMarginBuy: boolean;
  KCMarginSell: boolean;
  MarginBuy: boolean;
  MarginSell: boolean;
  PerSymbolLimit: number;
  UpperLimit: number;
  LowerLimit: number;
  Underlyer: string;
  DerivMonth: string;
  TradeStart: number;
  TradeEnd: number;
  StrikePrice: number;
  PutOrCall: number;
  ClearingPrice: number;
};

export type RankingDefaultResponse = {
  Type: string;
  ExchangeDivision: string;
  Ranking: Array<{
    No: number;
    Trend: string;
    AverageRanking: number;
    Symbol: string;
    SymbolName: string;
    CurrentPrice: number;
    ChangeRatio: number;
    ChangePercentage: number;
    CurrentPriceTime: string;
    TradingVolume: number;
    Turnover: number;
    ExchangeName: string;
    CategoryName: string;
  }>;
};

export type RankingByTickCountResponse = {
  Type: string;
  ExchangeDivision: string;
  Ranking: Array<{
    No: number;
    Trend: string;
    AverageRanking: number;
    Symbol: string;
    SymbolName: string;
    CurrentPrice: number;
    ChangeRatio: number;
    TickCount: number;
    UpCount: number;
    DownCount: number;
    ChangePercentage: number;
    TradingVolume: number;
    Turnover: number;
    ExchangeName: string;
    CategoryName: string;
  }>;
};

export type RankingByTradeVolumeResponse = {
  Type: string;
  ExchangeDivision: string;
  Ranking: Array<{
    No: number;
    Trend: string;
    AverageRanking: number;
    Symbol: string;
    SymbolName: string;
    CurrentPrice: number;
    ChangeRatio: number;
    RapidTradePercentage: number;
    TradingVolume: number;
    CurrentPriceTime: string;
    ChangePercentage: number;
    ExchangeName: string;
    CategoryName: string;
  }>;
};

export type RankingByTradeValueResponse = {
  Type: string;
  ExchangeDivision: string;
  Ranking: Array<{
    No: number;
    Trend: string;
    AverageRanking: number;
    Symbol: string;
    SymbolName: string;
    CurrentPrice: number;
    ChangeRatio: number;
    RapidPaymentPercentage: number;
    Turnover: number;
    CurrentPriceTime: string;
    ChangePercentage: number;
    ExchangeName: string;
    CategoryName: string;
  }>;
};

export type RankingByMarginResponse = {
  Type: string;
  ExchangeDivision: string;
  Ranking: Array<{
    No: number;
    Symbol: string;
    SymbolName: string;
    SellRapidPaymentPercentage: number;
    SellLastWeekRatio: number;
    BuyRapidPaymentPercentage: number;
    BuyLastWeekRatio: number;
    Ratio: number;
    ExchangeName: string;
    CategoryName: string;
  }>;
};

export type RankingByCategoryResponse = {
  Type: string;
  ExchangeDivision: string;
  Ranking: Array<{
    No: number;
    Trend: string;
    AverageRanking: number;
    Category: string;
    CategoryName: string;
    CurrentPrice: number;
    ChangeRatio: number;
    CurrentPriceTime: string;
    ChangePercentage: number;
  }>;
};

export type RankingResponse =
  | RankingDefaultResponse
  | RankingByTickCountResponse
  | RankingByTradeVolumeResponse
  | RankingByTradeValueResponse
  | RankingByMarginResponse
  | RankingByCategoryResponse;

export type ExchangeResponse = {
  Symbol: string;
  BidPrice: number;
  Spread: number;
  AskPrice: number;
  Change: number;
  Time: string;
};

export type RegulationsResponse = {
  Symbol: string;
  RegulationsInfo: Array<{
    Exchange: number;
    Product: number;
    Side: string;
    Reason: string;
    LimitStartDay: string;
    LimitEndDay: string;
    Level: number;
  }>;
};

export type PrimaryExchangeResponse = {
  Symbol: string;
  PrimaryExchange: number;
};

export type TimeAndSalesResponse = {
  Symbol: string;
  Exchange: number;
  TradingPriceCount: number;
  TradingPrice: Array<{
    Time: string;
    Volume: number;
    Price: number;
  }>;
};

export type SymbolNameSuccess = {
  Symbol: string;
  SymbolName: string;
};

export type MarginPremiumResponse = {
  Symbol: string;
  GeneralMargin: {
    MarginPremiumType: number;
    MarginPremium: number;
    UpperMarginPremium: number;
    LowerMarginPremium: number;
    TickMarginPremium: number;
  };
  DayTrade: {
    MarginPremiumType: number;
    MarginPremium: number;
    UpperMarginPremium: number;
    LowerMarginPremium: number;
    TickMarginPremium: number;
  };
};

export type OrdersSuccess = {
  ID: string;
  State: number;
  OrderState: number;
  OrdType: number;
  RecvTime: string;
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  TimeInForce: number;
  Price: number;
  OrderQty: number;
  CumQty: number;
  Side: string;
  CashMargin: number;
  AccountType: number;
  DelivType: number;
  ExpireDay: number;
  MarginTradeType: number;
  MarginPremium: number;
  Details: Array<{
    SeqNum: number;
    ID: string;
    RecType: number;
    ExchangeID: string;
    State: number;
    TransactTime: string;
    OrdType: number;
    Price: number;
    Qty: number;
    ExecutionID: string;
    ExecutionDay: string;
    DelivDay: number;
    Commission: number;
    CommissionTax: number;
  }>;
};

export type PositionsSuccess = {
  ExecutionID: string;
  AccountType: number;
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  SecurityType: number;
  ExecutionDay: number;
  Price: number;
  LeavesQty: number;
  HoldQty: number;
  Side: string;
  Expenses: number;
  Commission: number;
  CommissionTax: number;
  ExpireDay: number;
  MarginTradeType: number;
  CurrentPrice: number;
  Valuation: number;
  ProfitLoss: number;
  ProfitLossRate: number;
};

export type ApiSoftLimitResponse = {
  Stock: number;
  Margin: number;
  Future: number;
  FutureMini: number;
  FutureMicro: number;
  Option: number;
  MiniOption: number;
  KabuSVersion: string;
};

export type RequestRegister = {
  Symbols: Array<{
    Symbol: string;
    Exchange: number;
  }>;
};

export type RequestUnregister = {
  Symbols: Array<{
    Symbol: string;
    Exchange: number;
  }>;
};

export type RegistSuccess = {
  RegistList: Array<{
    Symbol: string;
    Exchange: number;
  }>;
};

export type UnregisterAllSuccess = {
  RegistList: Record<string, unknown>;
};

export type ExchangeCurrency =
  | 'usdjpy'
  | 'eurjpy'
  | 'gbpjpy'
  | 'audjpy'
  | 'chfjpy'
  | 'cadjpy'
  | 'nzdjpy'
  | 'zarjpy'
  | 'eurusd'
  | 'gbpusd'
  | 'audusd';
