import { prisma } from '../lib/prisma';

async function checkMonsters() {
  try {
    const monsters = await prisma.monsters.findMany({
      include: {
        party_monsters: {
          include: {
            parties: true,
          },
        },
      },
    });

    console.log('All Monsters:');
    console.log(JSON.stringify(monsters, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMonsters();
