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

interface BurnerRegistry { version: string; addresses: string[]; }
const registryPath = path.join(__dirname, '../data/burnerRegistry.json');
const burnerRegistry: BurnerRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const BURNER_SET = new Set(burnerRegistry.addresses.map(a => a.toLowerCase()));

export interface CreatorAnalysis {
  address: string | null;
  totalTokens: number;
  reliable: boolean;
}

export interface WhaleAnalysis {
  largestHolderPercent: number;
  top3Percent: number;
  top10Percent: number;
}

export interface LiquidityAnalysis {
  poolExists: boolean;
  liquidityUsd: number;
  dex: string | null;
  lpLocked: boolean;
  lpBurned: boolean;
  reliable: boolean;
}

export interface TokenMeta {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLockedOrBurned: boolean;
  topHoldersConcentration: number;
  tokenAgeHours: number;
  tokenAgeReliable: boolean;
  burnerHolderDetected: boolean;
  creator: CreatorAnalysis;
  whales: WhaleAnalysis;
  liquidity: LiquidityAnalysis;
}

export interface TokenSnapshot { meta: TokenMeta; }

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  };
  if (agent) (options as Record<string, unknown>).agent = agent;
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
interface AccountInfo { value: { data: { parsed: { info: MintInfo } } }; }
interface TokenAccount { address: string; amount: string; }
interface LargestAccountsResult { value: TokenAccount[]; }
interface SignatureInfo { signature: string; blockTime: number | null; }

async function getHolderAnalysis(mintAddress: string, totalSupply: string): Promise<{
  top10Percent: number;
  largestHolderPercent: number;
  top3Percent: number;
  burnerDetected: boolean;
}> {
  try {
    const result = await rpc('getTokenLargestAccounts', [mintAddress]) as LargestAccountsResult;
    const accounts = result.value;
    if (!accounts || accounts.length === 0) {
      return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false };
    }
    const total = parseFloat(totalSupply);
    if (total === 0) return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false };

    const pct = (n: number) => Math.min(100, Math.round((n / total) * 100));
    const top10Amount = accounts.slice(0, 10).reduce((s, a) => s + parseFloat(a.amount), 0);
    const top3Amount = accounts.slice(0, 3).reduce((s, a) => s + parseFloat(a.amount), 0);
    const largestAmount = parseFloat(accounts[0]?.amount ?? '0');
    const burnerDetected = accounts.some(a => BURNER_SET.has(a.address.toLowerCase()));

    return {
      top10Percent: pct(top10Amount),
      largestHolderPercent: pct(largestAmount),
      top3Percent: pct(top3Amount),
      burnerDetected,
    };
  } catch {
    return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false };
  }
}

interface TokenAgeResult { ageHours: number; reliable: boolean; }

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
        return { ageHours: Math.max(0, (nowSeconds - oldestBlockTime!) / 3600), reliable: true };
      }
      lastSignature = batchOldest.signature;
    }
    return { ageHours: 9999, reliable: false };
  } catch { return { ageHours: 9999, reliable: false }; }
}

async function getCreatorAnalysis(mintAddress: string): Promise<CreatorAnalysis> {
  try {
    let lastSignature: string | undefined = undefined;
    let oldestSig: string | null = null;
    const MAX_BATCHES = 3;
    for (let i = 0; i < MAX_BATCHES; i++) {
      const params: Record<string, unknown> = { limit: 1000 };
      if (lastSignature) params.before = lastSignature;
      const sigs = await rpc('getSignaturesForAddress', [mintAddress, params]) as SignatureInfo[];
      if (!sigs || sigs.length === 0) break;
      oldestSig = sigs[sigs.length - 1].signature;
      if (sigs.length < 1000) break;
      lastSignature = oldestSig;
    }
    if (!oldestSig) return { address: null, totalTokens: 0, reliable: false };

    const tx = await rpc('getTransaction', [
      oldestSig,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
    ]) as { transaction: { message: { accountKeys: Array<{ pubkey: string } | string> } } };

    if (!tx?.transaction?.message?.accountKeys) return { address: null, totalTokens: 0, reliable: false };

    const firstKey = tx.transaction.message.accountKeys[0];
    const creatorAddress = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey;
    if (!creatorAddress) return { address: null, totalTokens: 0, reliable: false };

    const creatorSigs = await rpc('getSignaturesForAddress', [creatorAddress, { limit: 1000 }]) as SignatureInfo[];
    const totalTokens = creatorSigs ? Math.floor(creatorSigs.length / 4) : 0;

    return { address: creatorAddress, totalTokens, reliable: true };
  } catch { return { address: null, totalTokens: 0, reliable: false }; }
}

interface DexScreenerPair {
  dexId: string;
  liquidity?: { usd?: number };
  lpBurned?: boolean;
  info?: { socials?: unknown[] };
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}

async function getLiquidityAnalysis(mintAddress: string): Promise<LiquidityAnalysis> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`;
    const fetchOptions: RequestInit = { method: 'GET' };
    if (agent) (fetchOptions as Record<string, unknown>).agent = agent;

    const res = await fetch(url, fetchOptions);
    const data = await res.json() as DexScreenerResponse;

    if (!data.pairs || data.pairs.length === 0) {
      return { poolExists: false, liquidityUsd: 0, dex: null, lpLocked: false, lpBurned: false, reliable: true };
    }

    // Sort by liquidity descending, take the biggest pool
    const pairs = data.pairs.filter(p => p.liquidity?.usd !== undefined);
    pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const best = pairs[0] ?? data.pairs[0];

    const liquidityUsd = best.liquidity?.usd ?? 0;
    const dex = best.dexId ?? null;
    const lpBurned = best.lpBurned ?? false;

    return {
      poolExists: true,
      liquidityUsd,
      dex,
      lpLocked: false, // v0.8: real LP lock detection
      lpBurned,
      reliable: true,
    };
  } catch {
    return { poolExists: false, liquidityUsd: 0, dex: null, lpLocked: false, lpBurned: false, reliable: false };
  }
}

export async function fetchUnifiedSnapshot(mintAddress: string): Promise<TokenSnapshot> {
  const info = await rpc('getAccountInfo', [mintAddress, { encoding: 'jsonParsed' }]) as AccountInfo;
  const parsed = info.value.data.parsed.info;

  const [holderAnalysis, ageResult, creator, liquidity] = await Promise.all([
    getHolderAnalysis(mintAddress, parsed.supply),
    getTokenAgeHours(mintAddress),
    getCreatorAnalysis(mintAddress),
    getLiquidityAnalysis(mintAddress),
  ]);

  return {
    meta: {
      mintAuthorityEnabled: parsed.mintAuthority !== null,
      freezeAuthorityEnabled: parsed.freezeAuthority !== null,
      lpLockedOrBurned: liquidity.lpBurned || liquidity.lpLocked,
      topHoldersConcentration: holderAnalysis.top10Percent,
      tokenAgeHours: ageResult.ageHours,
      tokenAgeReliable: ageResult.reliable,
      burnerHolderDetected: holderAnalysis.burnerDetected,
      creator,
      whales: {
        largestHolderPercent: holderAnalysis.largestHolderPercent,
        top3Percent: holderAnalysis.top3Percent,
        top10Percent: holderAnalysis.top10Percent,
      },
      liquidity,
    },
  };
}
