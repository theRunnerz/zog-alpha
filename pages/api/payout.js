/* pages/api/payout.js */
const TronWeb = require('tronweb');

// Initialize TronWeb on Server
const tronWeb = new TronWeb({
  fullHost: 'https://api.shasta.trongrid.io', // or Mainnet
  privateKey: process.env.TRON_OWNER_PRIVATE_KEY
});

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { matchId, winnerAddress } = req.body;

  try {
    const contract = await tronWeb.contract().at(CONTRACT_ADDRESS);
    
    // CALL RESOLVE FUNCTION
    // This executes on the blockchain.
    const result = await contract.resolveMatch(
      matchId, 
      winnerAddress
    ).send();

    return res.status(200).json({ success: true, tx: result });

  } catch (error) {
    console.error("Payout Error:", error);
    return res.status(500).json({ error: "Payout failed" });
  }
}