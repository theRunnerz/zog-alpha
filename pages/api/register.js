// pages/api/register.js
import { registerUser } from '../../src/core/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { xHandle, tronAddress } = req.body;

    if (!xHandle || !tronAddress) {
      return res.status(400).json({ error: 'Missing handle or address' });
    }

    // Call the beautifully clean Prisma database logic
    const user = await registerUser(xHandle, tronAddress);

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("API Route Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}