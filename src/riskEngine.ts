// NexusVeritas Risk Engine — Public API Layer
// Core implementation is proprietary. This module exposes the public interface.

export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreatorAnalysis {
  address: string | null;
  totalTokens: number;
  reliable: boolean;
}

export interface WhaleAnalysis {
  largestHolderPercent: number;
  top3Percent: number;
  top10Percent: number;
}

export interface LiquidityAnalysis {
  poolExists: boolean;
  liquidityUsd: number;
  dex: string | null;
  lpLocked: boolean;
  lpBurned: boolean;
  reliable: boolean;
}

export interface TokenMeta {
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLockedOrBurned: boolean;
  topHoldersConcentration: number;
  tokenAgeHours: number;
  tokenAgeReliable: boolean;
  burnerHolderDetected: boolean;
  creator: CreatorAnalysis;
  whales: WhaleAnalysis;
  liquidity: LiquidityAnalysis;
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
  CREATOR_SERIAL: 20,
  WHALE_LARGEST_OVER_50: 20,
  WHALE_LARGEST_OVER_25: 10,
  WHALE_TOP3_OVER_75: 15,
  LIQUIDITY_NONE: 30,
  LIQUIDITY_VERY_LOW: 20,
  LIQUIDITY_LOW: 10,
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
  if (meta.lpLockedOrBurned === false && meta.liquidity.poolExists && meta.liquidity.liquidityUsd < 100000) {
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
  if (meta.creator.reliable && meta.creator.totalTokens >= 5 && meta.creator.totalTokens <= 100) {
    score += WEIGHTS.CREATOR_SERIAL;
    reasons.push('Serial token deployer — creator launched ' + meta.creator.totalTokens + '+ tokens');
  }

  // Whale Dominance
  if (meta.whales.largestHolderPercent >= 50) {
    score += WEIGHTS.WHALE_LARGEST_OVER_50;
    reasons.push('Single whale controls ' + meta.whales.largestHolderPercent + '% of supply');
  } else if (meta.whales.largestHolderPercent >= 25) {
    score += WEIGHTS.WHALE_LARGEST_OVER_25;
    reasons.push('Large holder controls ' + meta.whales.largestHolderPercent + '% of supply');
  }
  if (meta.whales.top3Percent >= 75) {
    score += WEIGHTS.WHALE_TOP3_OVER_75;
    reasons.push('Top 3 wallets control ' + meta.whales.top3Percent + '% of supply');
  }

  // Liquidity Analysis
  if (meta.liquidity.reliable) {
    if (!meta.liquidity.poolExists) {
      score += WEIGHTS.LIQUIDITY_NONE;
      reasons.push('No liquidity pool found — token may be untradeable');
    } else if (meta.liquidity.liquidityUsd < 1000) {
      score += WEIGHTS.LIQUIDITY_VERY_LOW;
      reasons.push('Liquidity critically low — $' + Math.round(meta.liquidity.liquidityUsd));
    } else if (meta.liquidity.liquidityUsd < 10000) {
      score += WEIGHTS.LIQUIDITY_LOW;
      reasons.push('Liquidity low — $' + Math.round(meta.liquidity.liquidityUsd));
    }
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
