import { prisma } from '../lib/prisma';

async function checkPartyStatus() {
  try {
    console.log('🔍 Checking party status...\n');

    const parties = await prisma.parties.findMany({
      include: {
        party_members: {
          include: {
            users: {
              select: {
                display_name: true,
                email: true,
              },
            },
          },
        },
        party_monsters: {
          where: {
            is_active: true,
          },
          include: {
            monsters: true,
          },
        },
      },
    });

    console.log(`📊 Total Parties: ${parties.length}\n`);

    parties.forEach((party) => {
      const activeMonster = party.party_monsters[0];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Party: "${party.name}"`);
      console.log(`Code: ${party.invite_code}`);
      console.log(`Members: ${party.party_members.length}`);
      party.party_members.forEach((member) => {
        console.log(`  - ${member.users.display_name} (${member.users.email})`);
      });

      if (activeMonster) {
        console.log(`\n✅ Active Monster: ${activeMonster.monsters.name}`);
        console.log(`   Type: ${activeMonster.monsters.monster_type}`);
        console.log(
          `   HP: ${activeMonster.monsters.current_hp}/${activeMonster.monsters.max_hp}`
        );
      } else {
        console.log(`\n❌ NO ACTIVE MONSTER - Members cannot check in!`);
      }
    });

    console.log(`\n${'='.repeat(60)}\n`);

    const partiesWithoutMonsters = parties.filter(
      (p) => p.party_monsters.length === 0
    ).length;
    const partiesWithMonsters = parties.filter(
      (p) => p.party_monsters.length > 0
    ).length;

    console.log(`Summary:`);
    console.log(`  ✅ Parties with monsters: ${partiesWithMonsters}`);
    console.log(`  ❌ Parties without monsters: ${partiesWithoutMonsters}`);

    if (partiesWithoutMonsters > 0) {
      console.log(
        `\n⚠️  ${partiesWithoutMonsters} parties need monsters assigned!\n`
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPartyStatus();
