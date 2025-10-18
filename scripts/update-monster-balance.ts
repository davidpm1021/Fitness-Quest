import { PrismaClient, MonsterType } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Game Balance Phase 1 - Monster HP and Damage Update
 *
 * This script updates all existing monsters with new balanced stats:
 * - TANK: HP 600 → 2100 (3.5x), Damage [3,5] → [8,15]
 * - BALANCED: HP 400 → 1400 (3.5x), Damage [3,5] → [8,15]
 * - GLASS_CANNON: HP 300 → 1050 (3.5x), Damage [3,5] → [8,15]
 *
 * Target: 8-15 day defeat time for 4-person party
 */

interface MonsterUpdate {
  type: MonsterType;
  maxHp: number;
  baseDamage: number[];
}

const updates: MonsterUpdate[] = [
  {
    type: MonsterType.TANK,
    maxHp: 2100,
    baseDamage: [8, 15],
  },
  {
    type: MonsterType.BALANCED,
    maxHp: 1400,
    baseDamage: [8, 15],
  },
  {
    type: MonsterType.GLASS_CANNON,
    maxHp: 1050,
    baseDamage: [8, 15],
  },
];

async function updateMonsterBalance() {
  console.log("🎮 Starting Game Balance Phase 1 migration...\n");

  for (const update of updates) {
    console.log(`📊 Updating ${update.type} monsters...`);
    console.log(`   New HP: ${update.maxHp}`);
    console.log(`   New Damage: [${update.baseDamage[0]}, ${update.baseDamage[1]}]`);

    const result = await prisma.monsters.updateMany({
      where: {
        monster_type: update.type,
      },
      data: {
        max_hp: update.maxHp,
        current_hp: update.maxHp, // Reset current HP to new max
        base_damage: update.baseDamage,
      },
    });

    console.log(`   ✅ Updated ${result.count} ${update.type} monsters\n`);
  }

  // Get final count by type
  const tankCount = await prisma.monsters.count({
    where: { monster_type: MonsterType.TANK },
  });
  const balancedCount = await prisma.monsters.count({
    where: { monster_type: MonsterType.BALANCED },
  });
  const glassCannonCount = await prisma.monsters.count({
    where: { monster_type: MonsterType.GLASS_CANNON },
  });

  console.log("📈 Final Monster Stats:");
  console.log(`   TANK: ${tankCount} monsters @ 2100 HP, [8-15] damage`);
  console.log(`   BALANCED: ${balancedCount} monsters @ 1400 HP, [8-15] damage`);
  console.log(`   GLASS_CANNON: ${glassCannonCount} monsters @ 1050 HP, [8-15] damage`);
  console.log("\n✨ Game Balance Phase 1 migration complete!");
  console.log("🎯 Target: 8-15 day defeat time for 4-person party");
}

updateMonsterBalance()
  .catch((e) => {
    console.error("❌ Error updating monster balance:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
