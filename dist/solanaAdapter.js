"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUnifiedSnapshot = fetchUnifiedSnapshot;
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = require("https-proxy-agent");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv.config();
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const PROXY = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const agent = PROXY ? new https_proxy_agent_1.HttpsProxyAgent(PROXY) : undefined;
const registryPath = path.join(__dirname, '../data/burnerRegistry.json');
const burnerRegistry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const BURNER_SET = new Set(burnerRegistry.addresses.map(a => a.toLowerCase()));
const servicesPath = path.join(__dirname, '../data/knownServices.json');
const knownServices = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
const KNOWN_SERVICES_SET = new Set(knownServices.addresses.map(a => a.toLowerCase()));
async function rpc(method, params) {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    };
    if (agent)
        options.agent = agent;
    const res = await (0, node_fetch_1.default)(RPC_URL, options);
    const data = await res.json();
    return data.result;
}
async function getHolderAnalysis(mintAddress, totalSupply) {
    try {
        const result = await rpc('getTokenLargestAccounts', [mintAddress]);
        const accounts = result.value;
        if (!accounts || accounts.length === 0) {
            return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false, topHolders: [], holderAmounts: [] };
        }
        const total = parseFloat(totalSupply);
        if (total === 0)
            return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false, topHolders: [], holderAmounts: [] };
        const pct = (n) => Math.min(100, Math.round((n / total) * 100));
        const top10Amount = accounts.slice(0, 10).reduce((s, a) => s + parseFloat(a.amount), 0);
        const top3Amount = accounts.slice(0, 3).reduce((s, a) => s + parseFloat(a.amount), 0);
        const largestAmount = parseFloat(accounts[0]?.amount ?? '0');
        const burnerDetected = accounts.some(a => BURNER_SET.has(a.address.toLowerCase()));
        const topHolders = accounts.slice(0, 10).map(a => a.address);
        const holderAmounts = accounts.slice(0, 10).map(a => parseFloat(a.amount));
        return {
            top10Percent: pct(top10Amount),
            largestHolderPercent: pct(largestAmount),
            top3Percent: pct(top3Amount),
            burnerDetected,
            topHolders,
            holderAmounts,
        };
    }
    catch {
        return { top10Percent: 0, largestHolderPercent: 0, top3Percent: 0, burnerDetected: false, topHolders: [], holderAmounts: [] };
    }
}
async function getTokenAgeHours(mintAddress) {
    try {
        let oldestBlockTime = null;
        let lastSignature = undefined;
        const MAX_BATCHES = 3;
        for (let i = 0; i < MAX_BATCHES; i++) {
            const params = { limit: 1000 };
            if (lastSignature)
                params.before = lastSignature;
            const sigs = await rpc('getSignaturesForAddress', [mintAddress, params]);
            if (!sigs || sigs.length === 0)
                break;
            const batchOldest = sigs[sigs.length - 1];
            if (batchOldest.blockTime)
                oldestBlockTime = batchOldest.blockTime;
            if (sigs.length < 1000) {
                const nowSeconds = Math.floor(Date.now() / 1000);
                return { ageHours: Math.max(0, (nowSeconds - oldestBlockTime) / 3600), reliable: true };
            }
            lastSignature = batchOldest.signature;
        }
        return { ageHours: 9999, reliable: false };
    }
    catch {
        return { ageHours: 9999, reliable: false };
    }
}
async function getCreatorAnalysis(mintAddress) {
    try {
        let lastSignature = undefined;
        let oldestSig = null;
        const MAX_BATCHES = 3;
        for (let i = 0; i < MAX_BATCHES; i++) {
            const params = { limit: 1000 };
            if (lastSignature)
                params.before = lastSignature;
            const sigs = await rpc('getSignaturesForAddress', [mintAddress, params]);
            if (!sigs || sigs.length === 0)
                break;
            oldestSig = sigs[sigs.length - 1].signature;
            if (sigs.length < 1000)
                break;
            lastSignature = oldestSig;
        }
        if (!oldestSig)
            return { address: null, totalTokens: 0, reliable: false };
        const tx = await rpc('getTransaction', [
            oldestSig,
            { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
        ]);
        if (!tx?.transaction?.message?.accountKeys)
            return { address: null, totalTokens: 0, reliable: false };
        const firstKey = tx.transaction.message.accountKeys[0];
        const creatorAddress = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey;
        if (!creatorAddress)
            return { address: null, totalTokens: 0, reliable: false };
        const creatorSigs = await rpc('getSignaturesForAddress', [creatorAddress, { limit: 1000 }]);
        const totalTokens = creatorSigs ? Math.floor(creatorSigs.length / 4) : 0;
        return { address: creatorAddress, totalTokens, reliable: true };
    }
    catch {
        return { address: null, totalTokens: 0, reliable: false };
    }
}
async function getLiquidityAnalysis(mintAddress) {
    try {
        const url = `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`;
        const fetchOptions = { method: 'GET' };
        if (agent)
            fetchOptions.agent = agent;
        const res = await (0, node_fetch_1.default)(url, fetchOptions);
        const data = await res.json();
        if (!data.pairs || data.pairs.length === 0) {
            return { poolExists: false, liquidityUsd: 0, dex: null, lpLocked: false, lpBurned: false, reliable: true };
        }
        const pairs = data.pairs.filter(p => p.liquidity?.usd !== undefined);
        pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
        const best = pairs[0] ?? data.pairs[0];
        return {
            poolExists: true,
            liquidityUsd: best.liquidity?.usd ?? 0,
            dex: best.dexId ?? null,
            lpLocked: false,
            lpBurned: best.lpBurned ?? false,
            reliable: true,
        };
    }
    catch {
        return { poolExists: false, liquidityUsd: 0, dex: null, lpLocked: false, lpBurned: false, reliable: false };
    }
}
async function getWalletFunder(walletAddress) {
    try {
        const sigs = await rpc('getSignaturesForAddress', [walletAddress, { limit: 1000 }]);
        if (!sigs || sigs.length === 0)
            return null;
        const oldestSig = sigs[sigs.length - 1].signature;
        const tx = await rpc('getTransaction', [
            oldestSig,
            { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
        ]);
        if (!tx?.transaction?.message?.accountKeys)
            return null;
        const firstKey = tx.transaction.message.accountKeys[0];
        const funder = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey ?? null;
        if (funder && KNOWN_SERVICES_SET.has(funder.toLowerCase()))
            return null;
        return funder;
    }
    catch {
        return null;
    }
}
async function getInsiderNetworkAnalysis(topHolders, holderAmounts, totalSupply) {
    try {
        if (topHolders.length < 3) {
            return { insiderNetworkDetected: false, clusterSize: 0, clusterType: null, topHolderCoverage: 0, fundingWallet: null, reliable: false };
        }
        const holdersToCheck = topHolders.slice(0, 8);
        const funderPromises = holdersToCheck.map(h => getWalletFunder(h));
        const funders = await Promise.all(funderPromises);
        // Map funder → {count, indices}
        const funderMap = new Map();
        for (let i = 0; i < funders.length; i++) {
            const funder = funders[i];
            if (funder) {
                const entry = funderMap.get(funder) ?? { count: 0, indices: [] };
                entry.count++;
                entry.indices.push(i);
                funderMap.set(funder, entry);
            }
        }
        // Find largest cluster
        let maxCluster = 0;
        let fundingWallet = null;
        let clusterIndices = [];
        for (const [wallet, entry] of funderMap.entries()) {
            if (entry.count > maxCluster) {
                maxCluster = entry.count;
                fundingWallet = wallet;
                clusterIndices = entry.indices;
            }
        }
        if (maxCluster < 3) {
            return { insiderNetworkDetected: false, clusterSize: 0, clusterType: null, topHolderCoverage: 0, fundingWallet: null, reliable: true };
        }
        // Calculate coverage first to apply minimum threshold
        // Calculate % of supply controlled by cluster — use BigInt for large supply tokens
        let topHolderCoverage = 0;
        try {
            const totalBig = BigInt(totalSupply);
            const clusterBig = clusterIndices.reduce((sum, i) => {
                const amt = holderAmounts[i] ?? 0;
                return sum + BigInt(Math.round(amt));
            }, BigInt(0));
            topHolderCoverage = totalBig > 0n ? Math.round(Number(clusterBig * 100n / totalBig)) : 0;
        }
        catch {
            const total = parseFloat(totalSupply);
            const clusterAmount = clusterIndices.reduce((sum, i) => sum + (holderAmounts[i] ?? 0), 0);
            topHolderCoverage = total > 0 ? Math.round((clusterAmount / total) * 100) : 0;
        }
        // Minimum coverage threshold — suppress noise from large-cap tokens
        // where cluster owns negligible supply (< 3%)
        if (topHolderCoverage < 3) {
            return { insiderNetworkDetected: false, clusterSize: maxCluster, clusterType: 'shared_funding', topHolderCoverage, fundingWallet: null, reliable: true };
        }
        return {
            insiderNetworkDetected: true,
            clusterSize: maxCluster,
            clusterType: 'shared_funding',
            topHolderCoverage,
            fundingWallet, // only shown in debug mode via index.ts
            reliable: true,
        };
    }
    catch {
        return { insiderNetworkDetected: false, clusterSize: 0, clusterType: null, topHolderCoverage: 0, fundingWallet: null, reliable: false };
    }
}
async function fetchUnifiedSnapshot(mintAddress) {
    const info = await rpc('getAccountInfo', [mintAddress, { encoding: 'jsonParsed' }]);
    const parsed = info.value.data.parsed.info;
    const [holderAnalysis, ageResult, creator, liquidity] = await Promise.all([
        getHolderAnalysis(mintAddress, parsed.supply),
        getTokenAgeHours(mintAddress),
        getCreatorAnalysis(mintAddress),
        getLiquidityAnalysis(mintAddress),
    ]);
    const insiderNetwork = await getInsiderNetworkAnalysis(holderAnalysis.topHolders, holderAnalysis.holderAmounts, parsed.supply);
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
            insiderNetwork,
        },
    };
}
