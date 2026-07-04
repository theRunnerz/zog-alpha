import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// 1. Initialize Prisma 7 Adapter natively
const adapter = new PrismaBetterSqlite3({
  url: 'file:./prisma/dev.db'
});

// 2. Initialize Prisma Client directly
const prisma = new PrismaClient({ adapter });

export async function registerUser(xHandle: string, tronAddress: string) {
  const cleanHandle = xHandle.replace(/^@/, '').toLowerCase();

  return await prisma.user.upsert({
    where: { xHandle: cleanHandle },
    update: { tronAddress },
    create: {
      xHandle: cleanHandle,
      tronAddress,
    },
  });
}

export async function getTronAddressByXHandle(xHandle: string): Promise<string | null> {
  const cleanHandle = xHandle.replace(/^@/, '').toLowerCase();
  const user = await prisma.user.findUnique({
    where: { xHandle: cleanHandle },
  });
  return user ? user.tronAddress : null;
}
