import { PrismaClient } from '../app/generated/prisma'; 
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const plainPassword = "Admin123!";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin User",
      passwordHash,
    },
  });

  console.log("Seed user created:", user);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });