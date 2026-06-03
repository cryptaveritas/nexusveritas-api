import fetch, { RequestInit } from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as dotenv from 'dotenv';
dotenv.config();

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PROXY = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const agent = PROXY ? new HttpsProxyAgent(PROXY) : undefined;

export interface TokenMeta {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLockedOrBurned: boolean;
  topHoldersConcentration: number;
}

export interface TokenSnapshot {
  meta: TokenMeta;
}

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  };
  if (agent) {
    (options as Record<string, unknown>).agent = agent;
  }
  const res = await fetch(RPC_URL, options);
  const data = await res.json() as { result: unknown };
  return data.result;
}

interface MintInfo {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: string;
  decimals: number;
}

interface AccountInfo {
  value: {
    data: {
      parsed: {
        info: MintInfo;
      };
    };
  };
}

interface TokenAccount {
  address: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

interface LargestAccountsResult {
  value: TokenAccount[];
}

async function getTopHoldersConcentration(mintAddress: string, totalSupply: string): Promise<number> {
  try {
    const result = await rpc('getTokenLargestAccounts', [mintAddress]) as LargestAccountsResult;
    const accounts = result.value;

    if (!accounts || accounts.length === 0) return 0;

    const total = parseFloat(totalSupply);
    if (total === 0) return 0;

    // Top 10 holders concentration
    const top10Amount = accounts.slice(0, 10).reduce((sum, acc) => {
      return sum + parseFloat(acc.amount);
    }, 0);

    const concentration = Math.round((top10Amount / total) * 100);
    return Math.min(100, concentration);
  } catch {
    return 0;
  }
}

export async function fetchUnifiedSnapshot(mintAddress: string): Promise<TokenSnapshot> {
  const info = await rpc('getAccountInfo', [
    mintAddress,
    { encoding: 'jsonParsed' },
  ]) as AccountInfo;

  const parsed = info.value.data.parsed.info;
  const topHoldersConcentration = await getTopHoldersConcentration(mintAddress, parsed.supply);

  return {
    meta: {
      mintAuthorityEnabled: parsed.mintAuthority !== null,
      freezeAuthorityEnabled: parsed.freezeAuthority !== null,
      lpLockedOrBurned: true,
      topHoldersConcentration,
    },
  };
}
