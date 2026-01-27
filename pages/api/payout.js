/* pages/api/payout.js */

// 🟢 FIX: Use 'require' instead of 'import' for this specific library
const TronWeb = require('tronweb');

// ⚠️ YOUR DEPLOYED CONTRACT ADDRESS
const CONTRACT_ADDRESS = "TDYtR58aj5iQcCS7etZ1GwomY8QyxStu3x"; 

export default async function handler(req, res) {
  // 1. Check Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Check Environment Variable (Local & Vercel)
  const privateKey = process.env.TRON_OWNER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ ERROR: TRON_OWNER_PRIVATE_KEY is missing.");
    return res.status(500).json({ error: "Server Wallet Config Missing" });
  }

  const { matchId, winnerAddress } = req.body;

  try {
    console.log(`🤖 Payout Initiated. ID: ${matchId}`);

    // 3. Initialize TronWeb
    // We use the 'require' version of TronWeb properly here
    const tronWeb = new TronWeb({
      fullHost: 'https://api.shasta.trongrid.io', // ⚠️ Change to Mainnet if needed
      privateKey: privateKey
    });

    // 4. Connect to Contract
    const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);

    // 5. Execute Payout on Blockchain
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
      details: error.message || "Unknown error" 
    });
  }
}