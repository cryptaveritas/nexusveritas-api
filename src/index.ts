import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { computeRisk } from './riskEngine';
import { fetchUnifiedSnapshot } from './solanaAdapter';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting — simple in-memory
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

app.get('/api/risk/solana/:address', async (req, res) => {
  const ip = req.ip ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Limit: 30 per minute.',
    });
  }

  const { address } = req.params;
  const debug = req.query.debug === 'true';

  // Basic address validation
  if (!address || address.length < 32 || address.length > 44) {
    return res.status(400).json({
      error: 'invalid_address',
      message: 'Invalid Solana address format.',
    });
  }

  try {
    const snapshot = await Promise.race([
      fetchUnifiedSnapshot(address),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15_000)
      ),
    ]) as Awaited<ReturnType<typeof fetchUnifiedSnapshot>>;

    // Snapshot validation
    const meta = snapshot.meta;
    if (
      typeof meta.mintAuthorityEnabled !== 'boolean' ||
      typeof meta.freezeAuthorityEnabled !== 'boolean' ||
      typeof meta.topHoldersConcentration !== 'number' ||
      meta.topHoldersConcentration < 0 ||
      meta.topHoldersConcentration > 100
    ) {
      return res.status(200).json({
        address,
        chain: 'solana',
        status: 'insufficient_data',
        confidence: 'low',
        message: 'Snapshot validation failed — data may be incomplete.',
      });
    }

    const result = computeRisk(meta);

    // Audit log (no personal data)
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      address: address.slice(0, 8) + '...',
      score: result.score,
      class: result.class,
      rules: result.reasons.length,
    }));

    res.json({
      address,
      chain: 'solana',
      score: result.score,
      class: result.class,
      reasons: result.reasons,
      confidence: 'standard',
      ...(debug ? { snapshot: meta } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'timeout') {
      return res.status(503).json({
        error: 'timeout',
        status: 'insufficient_data',
        message: 'RPC request timed out. Try again.',
      });
    }
    return res.status(200).json({
      address,
      chain: 'solana',
      status: 'insufficient_data',
      confidence: 'low',
      message: 'Could not fetch token data from Solana RPC.',
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.4.1' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`NexusVeritas API v0.4.1 running on http://localhost:${port}`));
