// pages/api/scan.js
import { fetchPortfolio } from '../../lib/wallet';
import { calculateScores } from '../../lib/scoring';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { address, strategy } = req.body;

  if (!address) return res.status(400).json({ error: "Address required" });

  console.log(`🔍 Scanning Portfolio: ${address}`);

  // 1. Fetch Data
  const portfolio = await fetchPortfolio(address);

  if (!portfolio) {
    return res.status(500).json({ error: "Failed to fetch wallet data" });
  }

  // 2. Run Math
  const scores = calculateScores(portfolio, strategy || 'balanced');

  // 3. Return Canonical Data Model
  return res.status(200).json({
     wallet: address,
     totalValue: portfolio.totalValueUsd,
     topAssets: portfolio.assets.slice(0, 3), // Send top 3 for UI context
     scores: scores
  });
}