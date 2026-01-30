// lib/prices.js
import axios from 'axios';

// Map our internal symbols to CoinGecko API IDs
const CG_IDS = {
  'TRX': 'tron',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'USDD': 'usdd',
  'TUSD': 'true-usd',
  'JST': 'just-stablecoin',
  'SUN': 'sun-token',
  'BTT': 'bittorrent',
  'NFT': 'apenft' 
};

export async function getLivePrices() {
  try {
    // 1. Prepare string for API: "tron,tether,usdd..."
    const ids = Object.values(CG_IDS).join(',');
    
    // 2. Call CoinGecko (Free Tier)
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const response = await axios.get(url);
    const data = response.data; // { tron: { usd: 0.22 }, tether: { usd: 1.00 } }

    // 3. Format back to our simple Map: { 'TRX': 0.22, 'USDT': 1.00 }
    let priceMap = {};
    
    // Default fallback values in case API fails
    priceMap['TRX'] = 0.20; 
    priceMap['USDT'] = 1.00;

    Object.keys(CG_IDS).forEach(symbol => {
      const cgId = CG_IDS[symbol];
      if (data[cgId] && data[cgId].usd) {
        priceMap[symbol] = data[cgId].usd;
      } else {
        // Keep hardcoded fallback if missing
        if (symbol === 'USDT') priceMap[symbol] = 1.00;
        if (symbol === 'TRX') priceMap[symbol] = 0.20;
      }
    });

    return priceMap;

  } catch (error) {
    console.error("Price Service Error:", error.message);
    // Return safe defaults if API is down
    return { 'TRX': 0.22, 'USDT': 1.00, 'USDC': 1.00, 'USDD': 1.00 }; 
  }
}