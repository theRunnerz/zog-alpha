/* pages/api/payout.js */
import TronWeb from 'tronweb';

// ⚠️ Ensure these Match your GameCanvas and .env variables
const CONTRACT_ADDRESS = "TDYtR58aj5iQcCS7etZ1GwomY8QyxStu3x"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { matchId, winnerAddress } = req.body;

  // Initialize server-side wallet (The Referee)
  // This wallet must have TRX to pay for gas fees
  const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: process.env.TRON_OWNER_PRIVATE_KEY
  });

  try {
    const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
    
    // CALL RESOLVE FUNCTION on Blockchain
    const result = await contract.resolveMatch(
      matchId, 
      winnerAddress
    ).send();

    console.log("Payout Success:", result);
    return res.status(200).json({ success: true, tx: result });

  } catch (error) {
    console.error("Payout Error:", error);
    return res.status(500).json({ success: false, error: "Referree failed to pay out." });
  }
}