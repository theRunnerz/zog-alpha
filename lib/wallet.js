// lib/wallet.js
import axios from 'axios';

const COVALENT_API_KEY = process.env.COVALENT_API_KEY;
const CHAIN_ID = 'tron-mainnet'; // Covalent ID for TRON

// 1. SIMPLE ASSET TAGGING (MVP Hack)
// In a real app, you'd check CoinGecko categories. For MVP, we Map known tokens.
const KNOWN_ASSETS = {
  'TRX': { type: 'L1', risk: 'medium' },
  'USDT': { type: 'stable', risk: 'low' },
  'USDC': { type: 'stable', risk: 'low' },
  'USDD': { type: 'stable', risk: 'low' },
  'JST': { type: 'defi', risk: 'high' },
  'SUN': { type: 'defi', risk: 'high' },
  'BTT': { type: 'utility', risk: 'high' },
  'NFT': { type: 'nft_token', risk: 'max' }
};

export async function fetchPortfolio(address) {
  try {
    // 2. CALL COVALENT
    const url = `https://api.covalenthq.com/v1/${CHAIN_ID}/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`;
    
    const response = await axios.get(url);
    const items = response.data.data.items;

    let portfolio = {
      totalValueUsd: 0,
      assets: []
    };

    // 3. PROCESS & CLEAN DATA
    portfolio.assets = items.map(token => {
      const symbol = token.contract_ticker_symbol;
      const balance = parseInt(token.balance) / Math.pow(10, token.contract_decimals);
      const price = token.quote_rate || 0;
      const valueUsd = token.quote || 0;

      // Skip "Dust" (Value < $1.00)
      if (valueUsd < 1.00) return null;

      // Auto-tag asset based on our map, or default to 'unknown/high risk'
      const tag = KNOWN_ASSETS[symbol] || { type: 'alt', risk: 'high' };

      portfolio.totalValueUsd += valueUsd;

      return {
        symbol: symbol,
        name: token.contract_name,
        balance: balance,
        price: price,
        valueUsd: valueUsd,
        type: tag.type,
        riskLevel: tag.risk
      };
    }).filter(item => item !== null); // Remove dust

    // Sort by value (Highest first)
    portfolio.assets.sort((a, b) => b.valueUsd - a.valueUsd);

    return portfolio;

  } catch (error) {
    console.error("Covalent Fetch Error:", error.message);
    return null;
  }
}