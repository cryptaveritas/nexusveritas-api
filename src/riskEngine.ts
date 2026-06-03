// NexusVeritas Risk Engine — Public API Layer
// Core implementation is proprietary. This module exposes the public interface.

export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TokenMeta {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLockedOrBurned: boolean;
  topHoldersConcentration: number;
  tokenAgeHours: number;
  tokenAgeReliable: boolean;
  burnerHolderDetected: boolean;
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
  BURNER_HOLDER: 20,
  AGE_UNDER_1H: 20,
  AGE_UNDER_6H: 15,
  AGE_UNDER_24H: 10,
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
  if (meta.burnerHolderDetected) {
    score += WEIGHTS.BURNER_HOLDER;
    reasons.push('Known burner or suspicious wallet detected in top holders');
  }
  if (meta.tokenAgeReliable) {
    if (meta.tokenAgeHours < 1) {
      score += WEIGHTS.AGE_UNDER_1H;
      reasons.push('Token created less than 1 hour ago — extreme caution');
    } else if (meta.tokenAgeHours < 6) {
      score += WEIGHTS.AGE_UNDER_6H;
      reasons.push('Token created less than 6 hours ago — high caution');
    } else if (meta.tokenAgeHours < 24) {
      score += WEIGHTS.AGE_UNDER_24H;
      reasons.push('Token created less than 24 hours ago — caution advised');
    }
  }

  score = Math.min(100, score);

  const riskClass: RiskClass =
    score >= THRESHOLDS.CRITICAL ? 'CRITICAL' :
    score >= THRESHOLDS.HIGH ? 'HIGH' :
    score >= THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';

  return { score, class: riskClass, reasons };
}
