export interface Vault {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  token: string;
  apy: number; // percentage, e.g. 5.4
  tvl: number; // USD
  tvlChange7d?: number; // percentage change
  apyHistory?: number[]; // last N data points
  riskScore?: number; // computed 0-100
}

export interface Position {
  vaultId: string;
  vault: Vault;
  walletAddress: string;
  balance: number; // token units
  balanceUsd: number;
  shareOfPool: number; // 0-1
}

export interface Recommendation {
  currentVault: Vault;
  suggestedVault: Vault;
  currentPosition: Position;
  apyDelta: number;
  riskDelta: number;
  reason: string;
}

export interface LifiQuote {
  id: string;
  type: string;
  fromChainId: number;
  toChainId: number;
  fromToken: { symbol: string; address: string; chainId: number };
  toToken: { symbol: string; address: string; chainId: number };
  fromAmount: string;
  toAmount: string;
  transactionRequest?: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress?: string;
    executionDuration: number;
    feeCosts?: Array<{ name: string; amount: string; amountUSD: string }>;
  };
}

export interface VaultFilters {
  chain?: string;
  token?: string;
  protocol?: string;
  minApy?: number;
  maxRisk?: number;
}
