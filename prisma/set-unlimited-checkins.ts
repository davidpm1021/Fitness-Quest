import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUnlimitedCheckIns() {
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

    // Get user's party membership
    const partyMember = await prisma.partyMember.findFirst({
      where: { userId: user.id }
    });

    if (!partyMember) {
      console.log('❌ User is not in a party');
      return;
    }

    // Delete today's check-ins and goal check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: today
      }
    });

    console.log(`Found ${checkIns.length} check-in(s) for today`);

    // Delete goal check-ins first (foreign key)
    for (const checkIn of checkIns) {
      await prisma.goalCheckIn.deleteMany({
        where: { checkInId: checkIn.id }
      });
    }

    // Delete check-ins
    await prisma.checkIn.deleteMany({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: today
      }
    });

    console.log('✅ Deleted all check-ins for today');
    console.log('🎮 You now have unlimited check-ins for testing!');
    console.log('💡 Run this script again after each check-in to reset');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setUnlimitedCheckIns();
