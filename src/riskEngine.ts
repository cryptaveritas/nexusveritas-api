// NexusVeritas Risk Engine — Public API Layer
// Core implementation is proprietary. This module exposes the public interface.

export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TokenMeta {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLockedOrBurned: boolean;
  topHoldersConcentration: number;
}

export interface RiskResult {
  score: number;
  class: RiskClass;
  reasons: string[];
}

const WEIGHTS = {
  MINT_AUTHORITY: 25,
  FREEZE_AUTHORITY: 15,
  LP_UNLOCKED: 25,
  HOLDER_CONCENTRATION: 15,
};

const THRESHOLDS: Record<RiskClass, number> = {
  CRITICAL: 85,
  HIGH: 60,
  MEDIUM: 20,
  LOW: 0,
};

export function computeRisk(meta: TokenMeta): RiskResult {
  const reasons: string[] = [];
  let score = 0;

  if (meta.mintAuthorityEnabled) {
    score += WEIGHTS.MINT_AUTHORITY;
    reasons.push('Mint authority enabled — unlimited supply inflation risk');
  }
  if (meta.freezeAuthorityEnabled) {
    score += WEIGHTS.FREEZE_AUTHORITY;
    reasons.push('Freeze authority enabled — blacklist/pause possible');
  }
  if (meta.lpLockedOrBurned === false) {
    score += WEIGHTS.LP_UNLOCKED;
    reasons.push('Liquidity pool unlocked — rug pull risk');
  }
  if (meta.topHoldersConcentration >= 70) {
    score += WEIGHTS.HOLDER_CONCENTRATION;
    reasons.push('Top holders concentration is ' + meta.topHoldersConcentration + '%');
  }

  score = Math.min(100, score);

  const riskClass: RiskClass =
    score >= THRESHOLDS.CRITICAL ? 'CRITICAL' :
    score >= THRESHOLDS.HIGH ? 'HIGH' :
    score >= THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';

  return { score, class: riskClass, reasons };
}
