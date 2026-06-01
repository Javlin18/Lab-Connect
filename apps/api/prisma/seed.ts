import { config } from "dotenv";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";

config({
  path: resolve(process.cwd(), "../../.env")
});

const prisma = new PrismaClient();

async function main() {
  const email = "admin@labapp.com";
  const password = "admin123";
  const phone = "+10000000000";

  const admin = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      name: "Lab Admin",
      phone,
      role: "admin",
      passwordHash: password
    },
    create: {
      name: "Lab Admin",
      email,
      phone,
      role: "admin",
      passwordHash: password
    }
  });

  // Seed employee
  const empEmail = "employee@labapp.com";
  const empPassword = "employee123";
  const empPhone = "+10000000001";

  const employee = await prisma.user.upsert({
    where: { email: empEmail },
    update: {
      name: "Ravi Kumar",
      phone: empPhone,
      role: "employee",
      passwordHash: empPassword
    },
    create: {
      name: "Ravi Kumar",
      email: empEmail,
      phone: empPhone,
      role: "employee",
      passwordHash: empPassword
    }
  });

  // Ensure employee profile row exists
  await prisma.employee.upsert({
    where: { userId: employee.id },
    update: { zone: "Bhopal North Zone", isAvailable: true },
    create: { userId: employee.id, zone: "Bhopal North Zone", isAvailable: true }
  });

  console.log(
    JSON.stringify(
      {
        admin: { email, password, phone, role: admin.role },
        employee: { email: empEmail, password: empPassword, phone: empPhone, role: employee.role }
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
