import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetCheckIn() {
  try {
    const email = process.argv[2] || 'davidpmartin@gmail.com';

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    console.log('Found user:', user.username);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete today's check-ins and goal check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: {
        partyMember: {
          userId: user.id
        },
        checkInDate: today
      }
    });

    // Delete goal check-ins first (foreign key)
    for (const checkIn of checkIns) {
      await prisma.goalCheckIn.deleteMany({
        where: { checkInId: checkIn.id }
      });
    }

    // Delete check-ins
    const deleted = await prisma.checkIn.deleteMany({
      where: {
        partyMember: {
          userId: user.id
        },
        checkInDate: today
      }
    });

    console.log('✅ Deleted', deleted.count, 'check-in(s)');
    console.log('🎮 You can now check in again and see the animations!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCheckIn();
