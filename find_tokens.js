const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = new HttpsProxyAgent(PROXY);

fetch('https://api.dexscreener.com/token-boosts/latest/v1', { agent })
  .then(r => r.json())
  .then(data => {
    const candidates = data.filter(t => 
      t.chainId === 'solana' && 
      t.tokenAddress &&
      t.tokenAddress.slice(-4) !== 'pump'
    ).slice(0, 20);
    candidates.forEach(t => console.log(t.tokenAddress));
  })
  .catch(e => console.error(e.message));
