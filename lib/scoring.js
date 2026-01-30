// lib/scoring.js

export function calculateScores(portfolio, userStrategy = 'balanced') {
  if (!portfolio || portfolio.totalValueUsd === 0) return defaultZeroScore();

  const total = portfolio.totalValueUsd;
  const assets = portfolio.assets;

  // --- 1. LIQUIDITY SCORE (The "Wall" Metric) ---
  // Formula: % of Portfolio in Stablecoins.
  // Target: 20% is ideal (Score 100). 0% is dangerous (Score 0).
  const stableValue = assets
    .filter(a => a.type === 'stable')
    .reduce((sum, a) => sum + a.valueUsd, 0);
  
  const liquidityRatio = stableValue / total;
  let liquidityScore = Math.min((liquidityRatio / 0.20) * 100, 100); // 20% stables = 100 score

  // --- 2. DIVERSIFICATION SCORE (The "Analyst" Metric) ---
  // Formula: Herfindahl-Hirschman Index (HHI).
  // Sum of squares of percentage allocations.
  // 1 Asset = 10,000 pts (Bad). Many assets = Low pts (Good).
  let hhi = 0;
  assets.forEach(a => {
    const share = (a.valueUsd / total) * 100;
    hhi += (share * share); // share^2
  });

  // Normalize: HHI of 2500 (4 assets equal weight) is a "good" target (~80 score).
  // HHI of 10000 (1 asset) is "bad" (0 score).
  let diversificationScore = 0;
  if(hhi > 9000) diversificationScore = 10;
  else if(hhi > 5000) diversificationScore = 40;
  else if(hhi > 2500) diversificationScore = 70;
  else diversificationScore = 95;

  // --- 3. RISK SCORE (The "Degen" Metric) ---
  // Formula: % of portfolio in 'high' or 'max' risk assets vs 'low' risk.
  const riskValue = assets
    .filter(a => a.riskLevel === 'high' || a.riskLevel === 'max')
    .reduce((sum, a) => sum + a.valueUsd, 0);
  
  const riskRatio = riskValue / total; // 0.0 to 1.0
  let riskScore = riskRatio * 100; // Higher number = HIGHER RISK PROFILE

  // --- 4. STRATEGY ALIGNMENT (The "Strategist" Metric) ---
  // Does current risk match the User's choice?
  // Strategy: 'preservation' (Low Risk), 'balanced' (Med Risk), 'degen' (High Risk)
  let strategyScore = 50; 
  
  if (userStrategy === 'preservation') {
    // Want Low Risk Score (<30)
    strategyScore = riskScore < 30 ? 95 : (100 - riskScore);
  } else if (userStrategy === 'degen') {
    // Want High Risk Score (>70)
    strategyScore = riskScore > 70 ? 95 : riskScore;
  } else {
    // Balanced: Want Risk around 50
    const diff = Math.abs(50 - riskScore);
    strategyScore = 100 - (diff * 2);
  }

  // --- 5. TOTAL FOOTBALL SCORE ---
  // Weighted Average
  const totalScore = (
    (liquidityScore * 0.25) + 
    (diversificationScore * 0.25) + 
    (strategyScore * 0.30) + 
    (Math.abs(50 - riskScore) * 0.20) // Risk is subjective, so just weight it lightly
  );

  return {
    total: Math.floor(totalScore),
    breakdown: {
      liquidity: Math.floor(liquidityScore),
      diversification: Math.floor(diversificationScore),
      risk: Math.floor(riskScore), // Note: 100 Risk means "Very Risky"
      strategy: Math.floor(strategyScore)
    },
    topHolding: assets[0] ? assets[0].symbol : 'None',
    flags: generateFlags(liquidityScore, diversificationScore, riskScore)
  };
}

// Helper for "Coaching Points"
function generateFlags(liq, div, risk) {
  let flags = [];
  if (liq < 10) flags.push("CRITICAL_LIQUIDITY");
  if (div < 30) flags.push("SINGLE_POINT_FAILURE");
  if (risk > 80) flags.push("DEGEN_EXPOSURE");
  if (risk < 10) flags.push("PLAYING_TOO_SAFE");
  return flags;
}

function defaultZeroScore() {
  return { total: 0, breakdown: { liquidity: 0, diversification: 0, risk: 0, strategy: 0 }, flags: [] };
}