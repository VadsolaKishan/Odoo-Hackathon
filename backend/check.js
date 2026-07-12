const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const v = await prisma.vehicle.findMany();
  const d = await prisma.driver.findMany();
  console.dir({ vehicles: v, drivers: d }, { depth: null });
}
main().finally(() => prisma.$disconnect());
