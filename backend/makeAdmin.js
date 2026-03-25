const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Locating existing users...");
  const updated = await prisma.user.updateMany({
    data: {
       role: 'ADMIN' // Promoting to SaaS Owner
    }
  });
  console.log(`✅ Success! Promoted ${updated.count} user(s) to ADMIN.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
