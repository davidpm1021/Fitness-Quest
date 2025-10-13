import { prisma } from '../lib/prisma';

async function resetCheckIn() {
  const testUserEmail = 'test@example.com';

  // Get today's date as a Date object
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight

  console.log(`Resetting check-in for ${testUserEmail} on ${today.toISOString().split('T')[0]}...`);

  try {
    // Find the test user
    const user = await prisma.users.findUnique({
      where: { email: testUserEmail },
    });

    if (!user) {
      console.error('Test user not found');
      return;
    }

    // Find their party member record
    const partyMember = await prisma.partyMember.findFirst({
      where: { userId: user.id },
    });

    if (!partyMember) {
      console.error('Party member not found');
      return;
    }

    // Delete today's check-in
    const deleted = await prisma.checkIn.deleteMany({
      where: {
        partyMemberId: partyMember.id,
        checkInDate: today,
      },
    });

    console.log(`✅ Deleted ${deleted.count} check-in(s)`);
    console.log('You can now check in again to see the dice roll animation!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetCheckIn();
