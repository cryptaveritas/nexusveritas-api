import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { computeRisk } from './riskEngine';
import { fetchUnifiedSnapshot } from './solanaAdapter';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// — Stats counter —
const STATS_FILE = path.join(__dirname, '../data/stats.json');

function loadStats(): { totalAnalyzed: number; startedAt: string } {
  try {
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
  } catch {
    return { totalAnalyzed: 0, startedAt: new Date().toISOString() };
  }
}

function incrementStats(): void {
  const stats = loadStats();
  stats.totalAnalyzed++;
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

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

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

app.get('/api/risk/solana/:address', async (req, res) => {
  const ip = req.ip ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'rate_limit_exceeded', message: 'Too many requests. Limit: 30 per minute.' });
  }

  const { address } = req.params;
  const debug = req.query.debug === 'true';

  if (!address || address.length < 32 || address.length > 44) {
    return res.status(400).json({ error: 'invalid_address', message: 'Invalid Solana address format.' });
  }

  try {
    const snapshot = await Promise.race([
      fetchUnifiedSnapshot(address),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15_000)),
    ]) as Awaited<ReturnType<typeof fetchUnifiedSnapshot>>;

    const meta = snapshot.meta;
    if (
      typeof meta.mintAuthorityEnabled !== 'boolean' ||
      typeof meta.freezeAuthorityEnabled !== 'boolean' ||
      typeof meta.topHoldersConcentration !== 'number' ||
      meta.topHoldersConcentration < 0 ||
      meta.topHoldersConcentration > 100
    ) {
      return res.status(200).json({
        address, chain: 'solana', status: 'insufficient_data', confidence: 'low',
        message: 'Snapshot validation failed — data may be incomplete.',
      });
    }

    // Increment counter
    incrementStats();

    const result = computeRisk(meta);

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      address: address.slice(0, 8) + '...',
      score: result.score,
      class: result.class,
      rules: result.reasons.length,
    }));

    const insiderNetworkPublic = {
      insiderNetworkDetected: meta.insiderNetwork.insiderNetworkDetected,
      clusterSize: meta.insiderNetwork.clusterSize,
      clusterType: meta.insiderNetwork.clusterType,
      topHolderCoverage: meta.insiderNetwork.topHolderCoverage,
      reliable: meta.insiderNetwork.reliable,
      ...(debug ? { fundingWallet: meta.insiderNetwork.fundingWallet } : {}),
    };

    const snapshotPublic = debug ? {
      ...meta,
      insiderNetwork: insiderNetworkPublic,
    } : undefined;

    res.json({
      address,
      chain: 'solana',
      score: result.score,
      class: result.class,
      reasons: result.reasons,
      contributors: result.contributors,
      confidence: 'standard',
      ...(debug ? { snapshot: snapshotPublic } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'timeout') {
      return res.status(503).json({ error: 'timeout', status: 'insufficient_data', message: 'RPC request timed out. Try again.' });
    }
    return res.status(200).json({
      address, chain: 'solana', status: 'insufficient_data', confidence: 'low',
      message: 'Could not fetch token data from Solana RPC.',
    });
  }
});

app.get('/health', (_req, res) => {
  const stats = loadStats();
  res.json({ status: 'ok', version: '0.8.0', totalAnalyzed: stats.totalAnalyzed, startedAt: stats.startedAt });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`NexusVeritas API v0.8.0 running on http://localhost:${port}`));
