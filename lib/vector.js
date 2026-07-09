/**
 * lib/vector.js -- Canonical vector construction for NexusVeritas
 * Exports: toV(bp), toV1(bp), toV2(bp, opts), V2_DIMS
 */

function toV(bp) {
  const s = bp.structural || {}, b = bp.behavioral || {}, o = bp.operational || {};
  const sigDensity = (o.total_signatures || 0) / Math.max(o.days_active || 0, 1);
  const initProx = (b.avg_transfer_sol || 0) > 0
    ? Math.max(0, 1 - Math.abs(b.avg_transfer_sol - 0.002) / 0.002)
    : 0;
  const burst = (o.total_signatures || 0) / Math.max(o.days_active || 0, 1);
  return [
    Math.min((s.funding_sources_count || 0) / 10, 1.0),
    s.funding_concentration || 0,
    1 / (1 + (b.avg_transfer_sol || 0)),
    b.split_init_pattern ? 1 : 0,
    (s.funding_sources_count || 0) === 0 ? 1 : 0,
    Math.min(sigDensity / 100, 1.0),
    b.recycling_loop ? 1 : 0,
    1 / (1 + (s.wallet_age_days || 0) / 30),
    sigDensity > 50 ? 1 : sigDensity / 50,
    (o.total_signatures || 0) <= 20 ? 1 : 0,
    Math.min(Math.log1p(burst) / Math.log1p(3000), 1.0),
    (o.tokens_created || 0) <= 2 ? 1 : 0,
    Math.min(Math.log1p(o.days_active || 0) / Math.log1p(365), 1.0),
    Math.min((o.launch_frequency || 0) / 10, 1.0),
    ((o.tokens_created || 0) <= 2 && (o.total_signatures || 0) <= 15) ? 1 : 0,
    Math.min(Math.max(initProx, 0), 1.0),
    (b.total_incoming_sol || 0) <= 0.005 ? 1 : 0,
    ((s.wallet_age_days || 0) <= 1 && (o.tokens_created || 0) >= 100) ? 1 : 0,
    ((b.recycling_loop ? 0.5 : 0) + (b.split_init_pattern ? 0.5 : 0)),
    Math.max(0, 1 - (s.wallet_age_days || 0) / 30),
    (((s.funding_sources_count || 0) >= 1 && (b.total_incoming_sol || 0) >= 0.5) ? 1 : 0),
    (s.funding_concentration || 0) >= 0.9 ? 1 : (s.funding_concentration || 0),
    Math.min((s.wallet_age_days || 0) / 30, 1.0),
    Math.min((s.funding_sources_count || 0) / 5, 1.0),
    Math.min((b.total_incoming_sol || 0) / 100, 1.0),
  ];
}

function toV1(bp) {
  const num = v => (v === null || v === undefined || isNaN(v)) ? 0 : Number(v);
  const s = bp.structural || {}, b = bp.behavioral || {}, o = bp.operational || {};
  return [
    num(s.wallet_age_days),
    num(s.funding_sources_count),
    num(s.funding_concentration),
    num(b.transfer_count),
    Math.min(num(b.total_incoming_sol), 100),
    Math.min(num(o.tokens_created) / 1000, 1.0),
    Math.min(num(o.days_active), 365),
  ];
}

function toV2(bp, { flagWeight = 1.0 } = {}) {
  const v = toV(bp);
  if (flagWeight !== 1.0) {
    const flagDims = [3, 4, 6, 9, 11, 14, 16, 17, 18, 20];
    for (const d of flagDims) v[d] *= flagWeight;
  }
  return v;
}

const V2_DIMS = [
  'sources', 'concentr', 'smallXfer', 'splitInit', 'invisFund',
  'sigDens', 'recycle', 'recency', 'highFreq', 'minimal',
  'burst', 'singlePur', 'daysSpan', 'launchFq', 'factory',
  'initProx', 'microFund', 'walletRot', 'automation', 'freshInfra',
  'extFunded', 'highConc', 'maturity', 'manySrc', 'largeCap',
];

module.exports = { toV, toV1, toV2, V2_DIMS };
