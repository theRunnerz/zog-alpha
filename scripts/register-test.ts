import { registerUser } from '../src/core/db.js';
import dotenv from 'dotenv';
import * as path from 'path';
import { TronWeb } from 'tronweb';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function seed() {
  const key1 = process.env.TEST_AGENT_1_PRIVATE_KEY || '';
  const key2 = process.env.TEST_AGENT_2_PRIVATE_KEY || '';

  const t1 = new TronWeb({ fullHost: 'https://api.shasta.trongrid.io', privateKey: key1 });
  const t2 = new TronWeb({ fullHost: 'https://api.shasta.trongrid.io', privateKey: key2 });

  await registerUser("LilStarburst25", t1.defaultAddress.base58);
  await registerUser("FootballAliens", t2.defaultAddress.base58);

  console.log(`✅ Success!
  🔗 @LilStarburst25 is registered to Shasta Address: ${t1.defaultAddress.base58}
  🔗 @FootballAliens is registered to Shasta Address: ${t2.defaultAddress.base58}`);
}
seed();
