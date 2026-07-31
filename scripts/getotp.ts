import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const otps = await prisma.emailOtp.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("Recent Email OTPs:");
  console.table(otps.map(o => ({ email: o.email, code: o.code, verified: o.verified })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
