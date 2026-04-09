import type { LifiQuote } from '../types';

const LIFI_BASE_URL = import.meta.env.VITE_LIFI_BASE_URL || 'https://li.quest';
const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY || '';

export interface QuoteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress?: string;
}

export async function fetchLifiQuote(params: QuoteParams): Promise<LifiQuote> {
  const searchParams = new URLSearchParams({
    fromChain: params.fromChain,
    toChain: params.toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
  });
  if (params.toAddress) {
    searchParams.set('toAddress', params.toAddress);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (LIFI_API_KEY) {
    headers['x-lifi-api-key'] = LIFI_API_KEY;
  }

  const res = await fetch(`${LIFI_BASE_URL}/v1/quote?${searchParams.toString()}`, {
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LI.FI API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<LifiQuote>;
}
