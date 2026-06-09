const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = new HttpsProxyAgent(PROXY);

const seen = new Set();

async function fetchEndpoint(url) {
  try {
    const res = await fetch(url, { agent, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    return Array.isArray(data) ? data : (data.pairs || data.tokens || []);
  } catch (e) {
    return [];
  }
}

async function findTokens() {
  const results = await Promise.all([
    // Boosted tokens
    fetchEndpoint('https://api.dexscreener.com/token-boosts/latest/v1'),
    // Top boosted
    fetchEndpoint('https://api.dexscreener.com/token-boosts/top/v1'),
    // Latest profiles
    fetchEndpoint('https://api.dexscreener.com/token-profiles/latest/v1'),
    // New pairs on Raydium
    fetchEndpoint('https://api.dexscreener.com/latest/dex/search?q=solana&rankBy=trendingScoreH6&order=desc'),
  ]);

  const all = results.flat();
  const candidates = all
    .map(t => t.tokenAddress || t.baseToken?.address || t.address)
    .filter(addr =>
      addr &&
      addr.length >= 32 &&
      addr.slice(-4) !== 'pump' &&
      !seen.has(addr)
    )
    .filter(addr => { seen.add(addr); return true; })
    .slice(0, 30);

  candidates.forEach(addr => console.log(addr));
}

findTokens().catch(e => console.error(e.message));
