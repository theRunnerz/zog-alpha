/* lib/wallet.js - Uses TronGrid (Robust & Official) */
import axios from 'axios';

// 1. KNOWN CONTRACTS MAP (For MVP Price Simulation)
// In V2, you will replace the 'price' here with a live CoinGecko call.
const TOKEN_MAP = {
  // TRX is special, handled separately
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': { symbol: 'USDT', type: 'stable', risk: 'low', price: 1.00 },
  'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8': { symbol: 'USDC', type: 'stable', risk: 'low', price: 1.00 },
  'TPYmHEhy5n8TbhCornkfEL32U9rJw4g654': { symbol: 'USDD', type: 'stable', risk: 'low', price: 1.00 },
  'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9': { symbol: 'JST',  type: 'defi',   risk: 'high', price: 0.035 },
  'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s': { symbol: 'SUN',  type: 'defi',   risk: 'high', price: 0.022 },
  'NFT': { symbol: 'NFT', type: 'nft_token', risk: 'max', price: 0 } 
};

export async function fetchPortfolio(address) {
  try {
    console.log(`📡 Connecting to TronGrid for: ${address}`);
    
    // 2. CALL TRONGRID V1 ACCOUNT API
    const url = `https://api.trongrid.io/v1/accounts/${address}`;
    const response = await axios.get(url);
    const data = response.data.data[0];

    if (!data) return { totalValueUsd: 0, assets: [] };

    let portfolio = {
      totalValueUsd: 0,
      assets: []
    };

    // --- A. PROCESS TRX (Native Coin) ---
    // TronGrid returns balance in Sun (1 TRX = 1,000,000 Sun)
    const trxBalance = (data.balance || 0) / 1_000_000;
    const trxPrice = 0.22; // Hardcoded spot price for MVP
    const trxValue = trxBalance * trxPrice;

    if (trxValue > 0.01) {
      portfolio.assets.push({
        symbol: 'TRX',
        name: 'Tron',
        balance: trxBalance,
        price: trxPrice,
        valueUsd: trxValue,
        type: 'L1',
        riskLevel: 'medium'
      });
      portfolio.totalValueUsd += trxValue;
    }

    // --- B. PROCESS TRC-20 TOKENS ---
    // TronGrid returns trc20 tokens as an array of objects: { "CONTRACT_ADDR": "BALANCE_STRING" }
    if (data.trc20) {
      data.trc20.forEach(tokenObj => {
        // The object key is the contract address, value is balance
        const contractAddr = Object.keys(tokenObj)[0];
        const rawBalance = tokenObj[contractAddr];
        
        // Check if we know this token (USDT, USDC, etc)
        const def = TOKEN_MAP[contractAddr];
        
        if (def) {
          // Most TRC20 use 6 or 18 decimals. USDT uses 6.
          // For MVP, we assume 6 decimals for stables, 18 for others usually.
          // This is an estimation tag.
          const decimals = (def.symbol === 'USDT' || def.symbol === 'USDC') ? 6 : 18;
          const balance = parseFloat(rawBalance) / Math.pow(10, decimals);
          const value = balance * def.price;

          if (value > 0.01) {
            portfolio.assets.push({
              symbol: def.symbol,
              name: def.symbol,
              balance: balance,
              price: def.price,
              valueUsd: value,
              type: def.type,
              riskLevel: def.risk
            });
            portfolio.totalValueUsd += value;
          }
        }
      });
    }

    // Sort by Value
    portfolio.assets.sort((a, b) => b.valueUsd - a.valueUsd);

    return portfolio;

  } catch (error) {
    console.error("TronGrid Fetch Error:", error.message);
    return null;
  }
}