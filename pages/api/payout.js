/* pages/api/payout.js */
const TronWebLib = require('tronweb');

// ⚠️ YOUR DEPLOYED CONTRACT ADDRESS
const CONTRACT_ADDRESS = "TDYtR58aj5iQcCS7etZ1GwomY8QyxStu3x"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const privateKey = process.env.TRON_OWNER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ ERROR: TRON_OWNER_PRIVATE_KEY is missing.");
    return res.status(500).json({ error: "Server Wallet Config Missing" });
  }

  const { matchId, winnerAddress } = req.body;

  try {
    console.log(`🤖 Payout Initiated. ID: ${matchId}`);

    // 🟢 ROBUST IMPORT FIX
    // We check if the library is the class itself, or if the class is inside a property
    const TronWeb = TronWebLib.TronWeb || TronWebLib.default || TronWebLib;

    // Initialize
    const tronWeb = new TronWeb({
      fullHost: 'https://api.shasta.trongrid.io', // ⚠️ Use Mainnet for real money
      privateKey: privateKey
    });

    // Connect to Contract
    const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);

    // CALL RESOLVE FUNCTION
    const txId = await contract.resolveMatch(
      matchId, 
      winnerAddress
    ).send();

    console.log(`✅ Payout Successful. TX: ${txId}`);
    return res.status(200).json({ success: true, tx: txId });

  } catch (error) {
    console.error("❌ Payout Failed:", error);
    return res.status(500).json({ 
      error: "Transaction Failed", 
      details: error.message || error 
    });
  }
}