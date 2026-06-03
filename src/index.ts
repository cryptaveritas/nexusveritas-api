import express from 'express';
import cors from 'cors';
import { computeRisk, TokenSnapshot } from './riskEngine';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/risk/solana/:address', (req, res) => {
  const { address } = req.params;

  // Mock snapshot — real Solana RPC integration in v0.2
  const snapshot: TokenSnapshot = {
    mintAuthorityEnabled: false,
    freezeAuthorityEnabled: false,
    lpLockedOrBurned: true,
    topHoldersConcentration: 0,
  };

  const result = computeRisk(snapshot);

  res.json({
    address,
    chain: 'solana',
    ...result,
    note: 'Mock data — live Solana RPC integration coming in v0.2'
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`NexusVeritas API running on http://localhost:${port}`));