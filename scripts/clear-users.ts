// Script to clear all user data from the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllUsers() {
  try {
    console.log('Starting database cleanup...');

    // Delete in order of foreign key dependencies (child -> parent)

    // 1. Delete goal check-ins (references check_ins and goals)
    const goalCheckIns = await prisma.goal_check_ins.deleteMany({});
    console.log(`Deleted ${goalCheckIns.count} goal check-ins`);

    // 2. Delete check-ins (references party_members)
    const checkIns = await prisma.check_ins.deleteMany({});
    console.log(`Deleted ${checkIns.count} check-ins`);

    // 3. Delete welcome back bonuses (references party_members)
    const welcomeBack = await prisma.welcome_back_bonuses.deleteMany({});
    console.log(`Deleted ${welcomeBack.count} welcome back bonuses`);

    // 4. Delete encouragements (references party_members)
    const encouragements = await prisma.encouragements.deleteMany({});
    console.log(`Deleted ${encouragements.count} encouragements`);

    // 5. Delete healing actions (references party_members)
    const healingActions = await prisma.healing_actions.deleteMany({});
    console.log(`Deleted ${healingActions.count} healing actions`);

    // 6. Delete party member skills (references party_members)
    const partyMemberSkills = await prisma.party_member_skills.deleteMany({});
    console.log(`Deleted ${partyMemberSkills.count} party member skills`);

    // 7. Delete party messages (references parties and party_members)
    const messages = await prisma.party_messages.deleteMany({});
    console.log(`Deleted ${messages.count} party messages`);

    // 8. Delete party members (references parties and users)
    const partyMembers = await prisma.party_members.deleteMany({});
    console.log(`Deleted ${partyMembers.count} party members`);

    // 9. Delete party monsters (references parties)
    const partyMonsters = await prisma.party_monsters.deleteMany({});
    console.log(`Deleted ${partyMonsters.count} party monsters`);

    // 10. Delete victory rewards (references parties)
    const victoryRewards = await prisma.victory_rewards.deleteMany({});
    console.log(`Deleted ${victoryRewards.count} victory rewards`);

    // 11. Delete parties
    const parties = await prisma.parties.deleteMany({});
    console.log(`Deleted ${parties.count} parties`);

    // 12. Delete goals (references users)
    const goals = await prisma.goals.deleteMany({});
    console.log(`Deleted ${goals.count} goals`);

    // 13. Delete character appearances (references users)
    const appearances = await prisma.character_appearances.deleteMany({});
    console.log(`Deleted ${appearances.count} character appearances`);

    // 14. Delete user cosmetic unlocks (references users)
    const cosmeticUnlocks = await prisma.user_cosmetic_unlocks.deleteMany({});
    console.log(`Deleted ${cosmeticUnlocks.count} cosmetic unlocks`);

    // 15. Delete user sprite customizations (references users)
    const spriteCustomizations = await prisma.user_sprite_customizations.deleteMany({});
    console.log(`Deleted ${spriteCustomizations.count} sprite customizations`);

    // 16. Finally delete users
    const users = await prisma.users.deleteMany({});
    console.log(`Deleted ${users.count} users`);

    console.log('\n✅ Database cleanup complete!');
    console.log('All user accounts and related data have been removed.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAllUsers()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
