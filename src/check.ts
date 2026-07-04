import dotenv from 'dotenv';
import * as path from 'path';
import { TronWeb } from 'tronweb';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const tronWeb = new TronWeb({
  fullHost: 'https://api.shasta.trongrid.io',
  privateKey: process.env.TEST_AGENT_1_PRIVATE_KEY
});

async function checkState() {
  const contractAddress = process.env.FLASH_MARKET_CONTRACT || process.env.NEXT_PUBLIC_FLASH_MARKET_CONTRACT;
  const contract = await tronWeb.contract().at(contractAddress!);
  
  const balance = await tronWeb.trx.getBalance(contractAddress!);
  console.log(`💰 Total Pool Balance: ${balance / 1_000_000} TRX`);

  const yes = await contract.totalYesBets().call();
  console.log(`👍 Total YES Bets: ${tronWeb.toDecimal(yes) / 1_000_000} TRX`);

  const no = await contract.totalNoBets().call();
  console.log(`👎 Total NO Bets: ${tronWeb.toDecimal(no) / 1_000_000} TRX`);
}

checkState();