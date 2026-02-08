/* agent/treasury.js - PHASE 3: VIRTUAL DEFI ENGINE */

// This module simulates the on-chain economy based on social signals.
// It converts Likes/RTs into "Virtual TRX Liquidity" for the demo.

export function calculateMarketData(likes, rts, outcome) {
    // 1. Define "Virtual" Bet Sizes
    const BET_SIZE_AGREE = 1500; // 1 Like = 1500 TRX volume simulated
    const BET_SIZE_DISAGREE = 3000; // 1 RT = 3000 TRX volume simulated

    // 2. Calculate Total Liquidity Pool
    const poolAgree = likes * BET_SIZE_AGREE;
    const poolDisagree = rts * BET_SIZE_DISAGREE;
    const totalVolume = poolAgree + poolDisagree;

    // 3. Determine Winners
    const winningPool = outcome === "WIN" ? poolAgree : poolDisagree;
    
    // 4. Calculate Yield (APY equivalent)
    // If the pool was 10,000 and winners put in 2,000, they 5x their money.
    let yieldMultiplier = 0;
    if (winningPool > 0) {
        yieldMultiplier = (totalVolume / winningPool).toFixed(2);
    }

    return {
        totalVolume: totalVolume,
        poolAgree: poolAgree,
        poolDisagree: poolDisagree,
        payoutMultiplier: yieldMultiplier, // e.g., "3.5x"
        winners: outcome === "WIN" ? "BULLS (Likers)" : "BEARS (Retweeters)"
    };
}

export function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}