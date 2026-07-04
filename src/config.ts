import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  TRONGRID_KEY: process.env.TRONGRID_API_KEY || '',
  AGENT_ADDRESS: process.env.AGENT_ADDRESS || '',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  FLASH_MARKET_CONTRACT: process.env.FLASH_MARKET_CONTRACT || '', 
  MODE: 'ACTIVE', 
  INTERVAL_MS: 3600000, // 1 hour check interval
  SHASTA_RPC: 'https://api.shasta.trongrid.io'
};