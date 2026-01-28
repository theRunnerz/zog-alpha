/* pages/api/payout.js */
const TronWebLib = require('tronweb');

// ⚠️ YOUR CONTRACT ADDRESS
const CONTRACT_ADDRESS = "TDYtR58aj5iQcCS7etZ1GwomY8QyxStu3x"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // 1. Debug: Check if Key exists (Don't print the actual key!)
  const privateKey = process.env.TRON_OWNER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ CRITICAL: TRON_OWNER_PRIVATE_KEY is undefined in Vercel.");
    return res.status(500).json({ error: "Server Configuration Error: Key Missing" });
  }

  const { matchId, winnerAddress } = req.body;

  try {
    console.log(`🤖 Payout Request: Match ${matchId} -> Winner ${winnerAddress}`);

    // Robust Import
    const TronWeb = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;

    const tronWeb = new TronWeb({
      fullHost: 'https://api.shasta.trongrid.io',
      privateKey: privateKey
    });

    // Check Wallet Balance (Server)
    const address = tronWeb.address.fromPrivateKey(privateKey);
    const balance = await tronWeb.trx.getBalance(address);
    console.log(`🤖 Referee Wallet: ${address} | Balance: ${balance} SUN`);

    if (balance < 1000000) { // Less than 1 TRX
       throw new Error("Referee Wallet has low/zero TRX for Gas Fees!");
    }

    const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);

    // CALL RESOLVE
    // We add { feeLimit: 100_000_000 } to ensure it doesn't fail due to default limits
    const txId = await contract.resolveMatch(
      matchId, 
      winnerAddress
    ).send({
      feeLimit: 100_000_000 
    });

    console.log(`✅ Payout Success! Hash: ${txId}`);
    return res.status(200).json({ success: true, tx: txId });

  } catch (error) {
    // 🔍 PRINT THE REAL CAUSE
    console.error("❌ BLOCKCHAIN ERROR:", JSON.stringify(error, null, 2));
    
    // Sometimes the error text is just a string
    if (typeof error === 'string') console.error("❌ Error String:", error);

    return res.status(500).json({ 
      error: "Transaction Failed", 
      details: error.message || error 
    });
  }
}