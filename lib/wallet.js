/* lib/wallet.js - Updated to use TronScan API */
import axios from 'axios';

// 1. ASSET TAGGING
const KNOWN_ASSETS = {
  'TRX': { type: 'L1', risk: 'medium' },
  'USDT': { type: 'stable', risk: 'low' },
  'USDC': { type: 'stable', risk: 'low' },
  'USDD': { type: 'stable', risk: 'low' },
  'TUSD': { type: 'stable', risk: 'low' },
  'JST': { type: 'defi', risk: 'high' },
  'SUN': { type: 'defi', risk: 'high' },
  'BTT': { type: 'utility', risk: 'high' },
  'BTTOLD': { type: 'utility', risk: 'high' },
  'NFT': { type: 'nft_token', risk: 'max' },
  'WIN': { type: 'gamble', risk: 'max' }
};

export async function fetchPortfolio(address) {
  try {
    // 2. CALL TRONSCAN API (Public, No Key Required for MVP)
    // accessible tokens endpoint
    const url = `https://apilist.tronscanapi.com/api/account/tokens?address=${address}&start=0&limit=50&hidden=0&show=0&sortType=0`;
    
    console.log(`Fetching data from: ${url}`);
    const response = await axios.get(url);
    const data = response.data;
    const tokens = data.data || [];

    let portfolio = {
      totalValueUsd: 0,
      assets: []
    };

    // 3. PROCESS DATA
    portfolio.assets = tokens.map(token => {
      // Map TronScan fields to our App's standard format
      const symbol = token.tokenAbbr || token.tokenName || "Unknown";
      
      // TronScan provides 'balance' (raw) and 'decimals'
      const decimals = token.decimals || 6; // default to 6 if missing
      const rawBalance = parseFloat(token.balance); 
      const actualBalance = rawBalance / Math.pow(10, decimals);
      
      const price = token.priceInUsd || 0;
      const valueUsd = actualBalance * price;

      // Skip "Dust" (Value < $0.10)
      if (valueUsd < 0.10) return null;

      // Auto-tag
      const tag = KNOWN_ASSETS[symbol.toUpperCase()] || { type: 'alt', risk: 'high' };

      portfolio.totalValueUsd += valueUsd;

      return {
        symbol: symbol.toUpperCase(),
        name: token.tokenName,
        balance: actualBalance,
        price: price,
        valueUsd: valueUsd,
        type: tag.type,
        riskLevel: tag.risk
      };
    }).filter(item => item !== null); // Filter out nulls (dust)

    // Sort by Highest Value First
    portfolio.assets.sort((a, b) => b.valueUsd - a.valueUsd);

    return portfolio;

  } catch (error) {
    console.error("Wallet Fetch Error:", error.message);
    return null;
  }
}