import { prisma } from "../lib/prisma";

async function main() {
  await prisma.user.upsert({
    where: { email: "ada@example.com" },
    update: {},
    create: {
      email: "ada@example.com",
      name: "Ada",
      posts: {
        create: [
          {
            title: "Welcome to Prisma Postgres",
            content: "First seeded post.",
            published: true,
          },
          {
            title: "Draft idea",
            content: "Replace these starter rows with app data.",
          },
        ],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "grace@example.com" },
    update: {},
    create: {
      email: "grace@example.com",
      name: "Grace",
      posts: {
        create: {
          title: "Hello database",
          published: true,
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
