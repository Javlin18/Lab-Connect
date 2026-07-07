import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";
const prisma = new PrismaClient();
async function main() {
  const code = String(randomInt(1000, 10000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const dto = { phone: "+10000000000" };
  await prisma.phoneOtp.upsert({
    where: { phone: dto.phone },
    create: { phone: dto.phone, code, expiresAt },
    update: { code, expiresAt },
  });
  const user = await prisma.user.findFirst({
    where: { phone: dto.phone },
    select: { id: true, role: true, email: true, name: true },
  });
  await (prisma as any).systemAuditLog.create({
    data: {
      action: "OTP_GENERATED",
      actorId: user?.id ?? null,
      actorRole: user?.role ?? null,
      patientId: user?.role === "patient" ? user.id : null,
      employeeId: user?.role === "employee" ? user.id : null,
      metadata: { channel: "email", purpose: "collection_or_login" }
    }
  });
  console.log("Success");
}
main().catch(console.error).finally(() => prisma.$disconnect());
