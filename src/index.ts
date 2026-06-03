import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { computeRisk } from './riskEngine';
import { fetchUnifiedSnapshot } from './solanaAdapter';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/risk/solana/:address', async (req, res) => {
  const { address } = req.params;
  const debug = req.query.debug === 'true';

  try {
    const snapshot = await fetchUnifiedSnapshot(address);
    const result = computeRisk(snapshot.meta);

    res.json({
      address,
      chain: 'solana',
      score: result.score,
      class: result.class,
      reasons: result.reasons,
      ...(debug ? { snapshot: snapshot.meta } : {}),
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to fetch token data',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.2.0' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`NexusVeritas API v0.2 running on http://localhost:${port}`));
