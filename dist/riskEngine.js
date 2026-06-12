"use strict";
// NexusVeritas Risk Engine - Public API Layer
// Core implementation is proprietary. This module exposes the public interface.
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeRisk = computeRisk;
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
    INSIDER_SMALL: 10, // 3-4 wallets
    INSIDER_MEDIUM: 20, // 5-7 wallets
    INSIDER_LARGE: 30, // 8+ wallets
    LIQUIDITY_NONE: 30,
    LIQUIDITY_VERY_LOW: 20,
    LIQUIDITY_LOW: 10,
    AGE_UNDER_1H: 20,
    AGE_UNDER_6H: 15,
    AGE_UNDER_24H: 10,
};
const THRESHOLDS = {
    CRITICAL: 85,
    HIGH: 60,
    MEDIUM: 20,
    LOW: 0,
};
function computeRisk(meta) {
    const reasons = [];
    const contributors = [];
    let score = 0;
    const add = (signal, points, reason) => {
        score += points;
        reasons.push(reason);
        contributors.push({ signal, points, reason });
    };
    if (meta.mintAuthorityEnabled) {
        add('mintAuthority', WEIGHTS.MINT_AUTHORITY, 'Mint authority enabled - unlimited supply inflation risk');
    }
    if (meta.freezeAuthorityEnabled) {
        add('freezeAuthority', WEIGHTS.FREEZE_AUTHORITY, 'Freeze authority enabled - blacklist/pause possible');
    }
    if (meta.lpLockedOrBurned === false && meta.liquidity.poolExists && meta.liquidity.liquidityUsd < 100000) {
        add('lpUnlocked', WEIGHTS.LP_UNLOCKED, 'Liquidity pool unlocked - rug pull risk');
    }
    if (meta.topHoldersConcentration >= 70) {
        add('holderConcentration', WEIGHTS.HOLDER_CONCENTRATION, 'Top holders concentration is ' + meta.topHoldersConcentration + '%');
    }
    if (meta.burnerHolderDetected) {
        add('burnerHolder', WEIGHTS.BURNER_HOLDER, 'Known burner or suspicious wallet detected in top holders');
    }
    if (meta.creator.reliable && meta.creator.totalTokens >= 5 && meta.creator.totalTokens <= 100) {
        add('creatorSerial', WEIGHTS.CREATOR_SERIAL, 'Serial token deployer - creator launched ' + meta.creator.totalTokens + '+ tokens');
    }
    // Whale Dominance
    if (meta.whales.largestHolderPercent >= 50) {
        add('whaleLargest', WEIGHTS.WHALE_LARGEST_OVER_50, 'Single whale controls ' + meta.whales.largestHolderPercent + '% of supply');
    }
    else if (meta.whales.largestHolderPercent >= 25) {
        add('whaleLargest', WEIGHTS.WHALE_LARGEST_OVER_25, 'Large holder controls ' + meta.whales.largestHolderPercent + '% of supply');
    }
    if (meta.whales.top3Percent >= 75) {
        add('whaleTop3', WEIGHTS.WHALE_TOP3_OVER_75, 'Top 3 wallets control ' + meta.whales.top3Percent + '% of supply');
    }
    // Insider Network - graduated scoring
    if (meta.insiderNetwork.reliable && meta.insiderNetwork.insiderNetworkDetected) {
        const cs = meta.insiderNetwork.clusterSize;
        let points = WEIGHTS.INSIDER_SMALL;
        if (cs >= 8)
            points = WEIGHTS.INSIDER_LARGE;
        else if (cs >= 5)
            points = WEIGHTS.INSIDER_MEDIUM;
        const coverage = meta.insiderNetwork.topHolderCoverage;
        add('insiderNetwork', points, 'Insider network detected - ' + cs + ' wallets control ' + coverage + '% of supply and share a common funding source');
    }
    // Liquidity
    if (meta.liquidity.reliable) {
        if (!meta.liquidity.poolExists) {
            add('liquidity', WEIGHTS.LIQUIDITY_NONE, 'No liquidity pool found - token may be untradeable');
        }
        else if (meta.liquidity.liquidityUsd < 1000) {
            add('liquidity', WEIGHTS.LIQUIDITY_VERY_LOW, 'Liquidity critically low - $' + Math.round(meta.liquidity.liquidityUsd));
        }
        else if (meta.liquidity.liquidityUsd < 10000) {
            add('liquidity', WEIGHTS.LIQUIDITY_LOW, 'Liquidity low - $' + Math.round(meta.liquidity.liquidityUsd));
        }
    }
    // Token Age
    if (meta.tokenAgeReliable) {
        if (meta.tokenAgeHours < 1) {
            add('tokenAge', WEIGHTS.AGE_UNDER_1H, 'Token created less than 1 hour ago - extreme caution');
        }
        else if (meta.tokenAgeHours < 6) {
            add('tokenAge', WEIGHTS.AGE_UNDER_6H, 'Token created less than 6 hours ago - high caution');
        }
        else if (meta.tokenAgeHours < 24) {
            add('tokenAge', WEIGHTS.AGE_UNDER_24H, 'Token created less than 24 hours ago - caution advised');
        }
    }
    score = Math.min(100, score);
    const riskClass = score >= THRESHOLDS.CRITICAL ? 'CRITICAL' :
        score >= THRESHOLDS.HIGH ? 'HIGH' :
            score >= THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';
    return { score, class: riskClass, reasons, contributors };
}
