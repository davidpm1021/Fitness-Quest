/**
 * Delete today's check-in for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting today\'s check-in...\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Delete check-ins for today
  const deletedCheckIns = await prisma.check_ins.deleteMany({
    where: {
      check_in_date: today,
    },
  });

  console.log(`✅ Deleted ${deletedCheckIns.count} check-in record(s) for today`);

  // Delete any orphaned goal_check_ins (should be cascaded, but just in case)
  const deletedGoalCheckIns = await prisma.goal_check_ins.deleteMany({
    where: {
      check_ins: {
        check_in_date: today,
      },
    },
  });

  console.log(`✅ Deleted ${deletedGoalCheckIns.count} goal check-in record(s)`);
  console.log('\n🎉 Done! You can now test the check-in flow again.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
