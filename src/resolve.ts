import dotenv from 'dotenv';
import * as path from 'path';
import { TronWeb } from 'tronweb';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const fullNode = 'https://api.shasta.trongrid.io';
const tronWeb = new TronWeb({
  fullHost: fullNode,
  privateKey: process.env.TEST_AGENT_1_PRIVATE_KEY
});

async function resolveMarket(winningOutcome: boolean) {
  console.log(`\n⚖️ INCITIATING MARKET RESOLUTION...`);
  console.log(`🏆 Winning Outcome Declared: ${winningOutcome ? "YES (True)" : "NO (False)"}`);

  const contractAddress = process.env.FLASH_MARKET_CONTRACT || process.env.NEXT_PUBLIC_FLASH_MARKET_CONTRACT;
  if (!contractAddress) throw new Error("Contract address config missing!");

  try {
    const contract = await tronWeb.contract().at(contractAddress);

    // Call the resolveMarket function on your smart contract
    console.log("⏳ Sending resolution transaction to TRON Shasta network...");
    const tx = await contract.resolveMarket(winningOutcome).send({
      feeLimit: 500_000_000
    });

    console.log(`✅ MARKET RESOLVED SUCCESSFULLY!`);
    console.log(`📜 Transaction Hash: ${tx}`);
    console.log(`💸 Winnings have been distributed to the ${winningOutcome ? "YES" : "NO"} voters!`);
    
  } catch (error) {
    console.error("❌ Resolution Failed:", error);
  }
}

// Change this to 'false' if you want NO to win!
// We'll pass 'true' to make the YES bets win this round.
resolveMarket(false);