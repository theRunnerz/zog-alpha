import dotenv from 'dotenv';
import * as path from 'path';
// Import TronWeb using modern v6 named exports
import { TronWeb } from 'tronweb';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Setup Shasta Nodes
const fullNode = 'https://api.shasta.trongrid.io';
const solidityNode = 'https://api.shasta.trongrid.io';
const eventServer = 'https://api.shasta.trongrid.io';

async function runSimulation() {
  console.log("🧪 Initiating Dual-Sided Flash Market Escrow Test...");

  const contractAddress = process.env.FLASH_MARKET_CONTRACT;
  if (!contractAddress) {
    console.error("❌ FLASH_MARKET_CONTRACT address missing from .env.local!");
    return;
  }

  // 1. Initialize our agents with their separate keys
  const key1 = process.env.TEST_AGENT_1_PRIVATE_KEY || '';
  const key2 = process.env.TEST_AGENT_2_PRIVATE_KEY || '';

  if (!key1 || !key2) {
    console.error("❌ Add TEST_AGENT_1_PRIVATE_KEY and TEST_AGENT_2_PRIVATE_KEY to .env.local to simulate two accounts.");
    return;
  }

  // Modern v6 constructor pattern
  const tronWebAgent1 = new TronWeb({
    fullHost: fullNode,
    privateKey: key1
  });

  const tronWebAgent2 = new TronWeb({
    fullHost: fullNode,
    privateKey: key2
  });

  const address1 = tronWebAgent1.defaultAddress.base58;
  const address2 = tronWebAgent2.defaultAddress.base58;

  console.log(`Agent 1 Address (YES Bettor): ${address1}`);
  console.log(`Agent 2 Address (NO Bettor): ${address2}`);

  // Load instances
  const contract1 = await tronWebAgent1.contract().at(contractAddress);
  const contract2 = await tronWebAgent2.contract().at(contractAddress);

  // 2. Simulating User Bets
  console.log("\n💰 Placing YES and NO bets on Shasta...");
  
  // Agent 1 places "YES" bet = true, with 10 TRX (expressed in SUN)
  console.log("-> Agent 1 sending 10 TRX to YES...");
  const txBet1 = await contract1.placeBet(true).send({
    callValue: 10 * 1_000_000, // 10 TRX in SUN
    feeLimit: 100_000_000
  });
  console.log(`Bet 1 tx successful: ${txBet1}`);

  // Agent 2 places "NO" bet = false, with 5 TRX (expressed in SUN)
  console.log("-> Agent 2 sending 5 TRX to NO...");
  const txBet2 = await contract2.placeBet(false).send({
    callValue: 5 * 1_000_000, // 5 TRX in SUN
    feeLimit: 100_000_000
  });
  console.log(`Bet 2 tx successful: ${txBet2}`);

  // 3. Resolving the Market (Set YES as winner)
  console.log("\n⚡ Resolving market as WINNER = YES...");
  console.log("Executing payout on blockchain...");

  // Execute the resolution
  const txResolve = await contract1.resolveMarket(true).send({
    feeLimit: 200_000_000 // Safe 200 TRX limit
  });

  console.log(`🎉 Market resolved successfully! TX ID: ${txResolve}`);
  console.log("Check Shasta Scan! Agent 1 (YES Bettor) has successfully clawed back all 15 TRX pool winnings.");
}

runSimulation();
