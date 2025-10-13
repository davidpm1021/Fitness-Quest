import { prisma } from './lib/prisma';

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.checkIn.deleteMany({
    where: {
      checkInDate: today
    }
  });

  console.log(`Deleted ${result.count} check-ins for today`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
