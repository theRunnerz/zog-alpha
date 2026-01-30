/* lib/wallet.js - With Live Data */
import axios from 'axios';
import { getLivePrices } from './prices'; // <--- IMPORT THIS

// CONTRACT MAPPING
const TOKEN_MAP = {
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': { symbol: 'USDT', type: 'stable', risk: 'low' },
  'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8': { symbol: 'USDC', type: 'stable', risk: 'low' },
  'TPYmHEhy5n8TbhCornkfEL32U9rJw4g654': { symbol: 'USDD', type: 'stable', risk: 'low' },
  'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9': { symbol: 'JST',  type: 'defi',   risk: 'high' },
  'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3s': { symbol: 'SUN',  type: 'defi',   risk: 'high' },
  'NFT': { symbol: 'NFT', type: 'nft_token', risk: 'max' } 
};

export async function fetchPortfolio(address) {
  try {
    console.log(`📡 Connecting to TronGrid for: ${address}`);
    
    // --- PARALLEL FETCHING (Faster) ---
    // Fetch Wallet Data AND Prices at the same time
    const [walletRes, prices] = await Promise.all([
      axios.get(`https://api.trongrid.io/v1/accounts/${address}`),
      getLivePrices()
    ]);

    const data = walletRes.data.data[0];
    if (!data) return { totalValueUsd: 0, assets: [] };

    let portfolio = {
      totalValueUsd: 0,
      assets: []
    };

    // --- A. PROCESS TRX ---
    const trxBalance = (data.balance || 0) / 1_000_000;
    const trxPrice = prices['TRX'] || 0.22; // Use Live Price
    const trxValue = trxBalance * trxPrice;

    // Use 0.01 threshold for testing
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
    if (data.trc20) {
      data.trc20.forEach(tokenObj => {
        const contractAddr = Object.keys(tokenObj)[0];
        const rawBalance = tokenObj[contractAddr];
        
        const def = TOKEN_MAP[contractAddr];
        
        if (def) {
          const decimals = (def.symbol === 'USDT' || def.symbol === 'USDC') ? 6 : 18;
          const balance = parseFloat(rawBalance) / Math.pow(10, decimals);
          
          // Use Live Price from our new service
          const currentPrice = prices[def.symbol] || 0; 
          const value = balance * currentPrice;

          if (value > 0.01) {
            portfolio.assets.push({
              symbol: def.symbol,
              name: def.symbol,
              balance: balance,
              price: currentPrice,
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
    
    // Round total to 2 decimals
    portfolio.totalValueUsd = Math.round(portfolio.totalValueUsd * 100) / 100;

    return portfolio;

  } catch (error) {
    console.error("Wallet Fetch Error:", error.message);
    return null;
  }
}