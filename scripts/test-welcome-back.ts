/**
 * Test script for Welcome Back System
 *
 * This script:
 * 1. Finds a test user (or creates one)
 * 2. Sets their last check-in to 4 days ago
 * 3. Reduces their HP to make the restoration visible
 * 4. Prints instructions for manual testing
 */

// Direct import since we can't use path alias in standalone scripts
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Setting up Welcome Back System test...\n');

  // Find a user to test with (any user)
  const user = await prisma.users.findFirst({
    where: {
      onboarding_step: 'complete',
    },
    include: {
      party_members: {
        include: {
          check_ins: {
            orderBy: { check_in_date: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!user) {
    console.error('❌ No users found with completed onboarding');
    console.log('Please register a user first');
    return;
  }

  const partyMember = user.party_members[0];
  if (!partyMember) {
    console.error(`❌ User ${user.display_name} has no party membership`);
    console.log('Please join a party first');
    return;
  }

  console.log(`✅ Found test user: ${user.display_name} (${user.email})`);
  console.log(`   Party Member ID: ${partyMember.id}`);
  console.log(`   Current HP: ${partyMember.current_hp}/${partyMember.max_hp}`);

  // Set last check-in to 4 days ago
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  fourDaysAgo.setHours(0, 0, 0, 0);

  // Check if there's a check-in from 4 days ago, if not create one
  const existingCheckIn = await prisma.check_ins.findFirst({
    where: {
      party_member_id: partyMember.id,
      check_in_date: fourDaysAgo,
    },
  });

  if (!existingCheckIn) {
    console.log(`\n📅 Creating a check-in from 4 days ago...`);
    await prisma.check_ins.create({
      data: {
        id: `checkin_${Date.now()}`,
        party_member_id: partyMember.id,
        party_id: partyMember.party_id,
        check_in_date: fourDaysAgo,
        goals_met: 1,
        is_rest_day: false,
        attack_roll: 10,
        attack_bonus: 2,
        damage_dealt: 5,
        was_hit_by_monster: false,
        damage_taken: 0,
      },
    });
    console.log('✅ Created check-in from 4 days ago');
  } else {
    console.log(`\n✅ User already has a check-in from 4 days ago`);
  }

  // Delete any check-ins from the last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  const deletedCount = await prisma.check_ins.deleteMany({
    where: {
      party_member_id: partyMember.id,
      check_in_date: {
        gt: fourDaysAgo,
      },
    },
  });

  if (deletedCount.count > 0) {
    console.log(`🗑️  Deleted ${deletedCount.count} recent check-in(s)`);
  }

  // Reduce HP to 30% to make restoration more visible
  const targetHp = Math.floor(partyMember.max_hp * 0.3);
  await prisma.party_members.update({
    where: { id: partyMember.id },
    data: {
      current_hp: targetHp,
    },
  });
  console.log(`💔 Reduced HP to ${targetHp}/${partyMember.max_hp} (30%)`);

  // Clean up any existing welcome back bonuses for this user
  await prisma.welcome_back_bonuses.deleteMany({
    where: {
      party_member_id: partyMember.id,
    },
  });
  console.log('🧹 Cleaned up any existing welcome back bonuses\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST SETUP COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 TESTING INSTRUCTIONS:\n');
  console.log('1. Login as:', user.email);
  console.log('   (If you forgot the password, create a new test user)\n');

  console.log('2. Navigate to /check-in page\n');

  console.log('3. EXPECTED RESULTS:');
  console.log('   ✓ Welcome Back modal should appear');
  console.log('   ✓ Shows "You were gone for 4 days"');
  console.log(`   ✓ HP should be restored (currently at ${targetHp}/${partyMember.max_hp})`);
  console.log('   ✓ Shows bonuses: +5 damage, reduced counterattack, 3 check-ins\n');

  console.log('4. Complete a check-in:');
  console.log('   ✓ Should deal +5 bonus damage (base 3-5 + 5 = 8-10)');
  console.log('   ✓ Counterattack chance should be reduced by 50%\n');

  console.log('5. Check-in again tomorrow (or run this script again):');
  console.log('   ✓ Should still have bonus (2 check-ins remaining)');
  console.log('   ✓ After 3rd check-in, bonus should expire\n');

  console.log('6. To verify bonus expiration:');
  console.log('   - Check database: welcome_back_bonuses table');
  console.log('   - After 3 check-ins, is_active should be false\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
