import fetch, { RequestInit } from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PROXY = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const agent = PROXY ? new HttpsProxyAgent(PROXY) : undefined;

// Load burner registry
interface BurnerRegistry {
  version: string;
  addresses: string[];
}

const registryPath = path.join(__dirname, '../data/burnerRegistry.json');
const burnerRegistry: BurnerRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const BURNER_SET = new Set(burnerRegistry.addresses.map(a => a.toLowerCase()));

export interface TokenMeta {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLockedOrBurned: boolean;
  topHoldersConcentration: number;
  tokenAgeHours: number;
  tokenAgeReliable: boolean;
  burnerHolderDetected: boolean;
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
}

interface LargestAccountsResult {
  value: TokenAccount[];
}

interface SignatureInfo {
  signature: string;
  blockTime: number | null;
}

async function getTopHoldersConcentration(mintAddress: string, totalSupply: string): Promise<number> {
  try {
    const result = await rpc('getTokenLargestAccounts', [mintAddress]) as LargestAccountsResult;
    const accounts = result.value;
    if (!accounts || accounts.length === 0) return 0;
    const total = parseFloat(totalSupply);
    if (total === 0) return 0;
    const top10Amount = accounts.slice(0, 10).reduce((sum, acc) => sum + parseFloat(acc.amount), 0);
    return Math.min(100, Math.round((top10Amount / total) * 100));
  } catch {
    return 0;
  }
}

async function checkBurnerHolders(mintAddress: string): Promise<boolean> {
  try {
    const result = await rpc('getTokenLargestAccounts', [mintAddress]) as LargestAccountsResult;
    const accounts = result.value;
    if (!accounts || accounts.length === 0) return false;
    return accounts.some(acc => BURNER_SET.has(acc.address.toLowerCase()));
  } catch {
    return false;
  }
}

interface TokenAgeResult {
  ageHours: number;
  reliable: boolean;
}

async function getTokenAgeHours(mintAddress: string): Promise<TokenAgeResult> {
  try {
    let oldestBlockTime: number | null = null;
    let lastSignature: string | undefined = undefined;
    const MAX_BATCHES = 3;

    for (let i = 0; i < MAX_BATCHES; i++) {
      const params: Record<string, unknown> = { limit: 1000 };
      if (lastSignature) params.before = lastSignature;

      const sigs = await rpc('getSignaturesForAddress', [mintAddress, params]) as SignatureInfo[];
      if (!sigs || sigs.length === 0) break;

      const batchOldest = sigs[sigs.length - 1];
      if (batchOldest.blockTime) oldestBlockTime = batchOldest.blockTime;

      if (sigs.length < 1000) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        return {
          ageHours: Math.max(0, (nowSeconds - oldestBlockTime!) / 3600),
          reliable: true,
        };
      }

      lastSignature = batchOldest.signature;
    }

    return { ageHours: 9999, reliable: false };
  } catch {
    return { ageHours: 9999, reliable: false };
  }
}

export async function fetchUnifiedSnapshot(mintAddress: string): Promise<TokenSnapshot> {
  const info = await rpc('getAccountInfo', [
    mintAddress,
    { encoding: 'jsonParsed' },
  ]) as AccountInfo;

  const parsed = info.value.data.parsed.info;

  const [topHoldersConcentration, ageResult, burnerHolderDetected] = await Promise.all([
    getTopHoldersConcentration(mintAddress, parsed.supply),
    getTokenAgeHours(mintAddress),
    checkBurnerHolders(mintAddress),
  ]);

  return {
    meta: {
      mintAuthorityEnabled: parsed.mintAuthority !== null,
      freezeAuthorityEnabled: parsed.freezeAuthority !== null,
      lpLockedOrBurned: true,
      topHoldersConcentration,
      tokenAgeHours: ageResult.ageHours,
      tokenAgeReliable: ageResult.reliable,
      burnerHolderDetected,
    },
  };
}
