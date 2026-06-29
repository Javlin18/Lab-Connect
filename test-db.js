const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'labconnect.work@gmail.com' } });
  console.log('User by email:', user);
  const user2 = await prisma.user.findFirst({ where: { phone: '7093080021' } });
  console.log('User by phone:', user2);
}
main().catch(console.error).finally(() => prisma.$disconnect());
