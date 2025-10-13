import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCosmetics() {
  console.log("Seeding cosmetic items...");

  const cosmetics = [
    // STARTER BODIES
    {
      name: "Male Light Skin",
      description: "Default male body with light skin tone",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/body/male-light.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 1,
    },
    {
      name: "Male Brown Skin",
      description: "Male body with brown skin tone",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/body/male-brown.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 2,
    },
    {
      name: "Female Light Skin",
      description: "Default female body with light skin tone",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/body/female-light.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 3,
    },
    {
      name: "Female Brown Skin",
      description: "Female body with brown skin tone",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/body/female-brown.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 4,
    },
    {
      name: "Muscular Build",
      description: "Muscular body type - earned through consistency!",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/body/muscular-light.png",
      unlockConditionType: "STREAK_DAYS" as const,
      unlockThreshold: 30,
      isStarterItem: false,
      sortOrder: 5,
    },

    // HAIR STYLES
    {
      name: "Short Hair",
      description: "Classic short hairstyle",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/hair-short.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 1,
    },
    {
      name: "Messy Hair",
      description: "Unlock after your first week of consistency",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/hair/messy.png",
      unlockConditionType: "STREAK_DAYS" as const,
      unlockThreshold: 7,
      isStarterItem: false,
      sortOrder: 2,
    },
    {
      name: "Long Hair",
      description: "Flowing locks for the dedicated warrior",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/hair/long.png",
      unlockConditionType: "CHECK_IN_COUNT" as const,
      unlockThreshold: 20,
      isStarterItem: false,
      sortOrder: 3,
    },
    {
      name: "Mohawk",
      description: "Bold style for the fearless",
      category: "HAIR" as const,
      spriteSheetPath: "/sprites/hair/mohawk.png",
      unlockConditionType: "MONSTERS_DEFEATED" as const,
      unlockThreshold: 3,
      isStarterItem: false,
      sortOrder: 4,
    },

    // CLOTHING
    {
      name: "Basic Shirt",
      description: "Simple comfortable shirt",
      category: "CLOTHING" as const,
      spriteSheetPath: "/sprites/shirt-basic.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 1,
    },
    {
      name: "Athletic Gear",
      description: "Performance clothing for serious athletes",
      category: "CLOTHING" as const,
      spriteSheetPath: "/sprites/clothing/athletic.png",
      unlockConditionType: "CHECK_IN_COUNT" as const,
      unlockThreshold: 10,
      isStarterItem: false,
      sortOrder: 2,
    },
    {
      name: "Armor",
      description: "Protective gear for veteran warriors",
      category: "CLOTHING" as const,
      spriteSheetPath: "/sprites/clothing/armor.png",
      unlockConditionType: "MONSTERS_DEFEATED" as const,
      unlockThreshold: 5,
      isStarterItem: false,
      sortOrder: 3,
    },
    {
      name: "Wizard Robes",
      description: "Mystical robes for the wise",
      category: "CLOTHING" as const,
      spriteSheetPath: "/sprites/clothing/wizard.png",
      unlockConditionType: "FOCUS_POINTS" as const,
      unlockThreshold: 15,
      isStarterItem: false,
      sortOrder: 4,
    },

    // ACCESSORIES
    {
      name: "Baseball Cap",
      description: "Casual headwear",
      category: "ACCESSORY" as const,
      spriteSheetPath: "/sprites/hat-cap.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 1,
    },
    {
      name: "Headband",
      description: "For focused training sessions",
      category: "ACCESSORY" as const,
      spriteSheetPath: "/sprites/accessories/headband.png",
      unlockConditionType: "CHECK_IN_COUNT" as const,
      unlockThreshold: 5,
      isStarterItem: false,
      sortOrder: 2,
    },
    {
      name: "Crown",
      description: "For those who've truly mastered consistency",
      category: "ACCESSORY" as const,
      spriteSheetPath: "/sprites/accessories/crown.png",
      unlockConditionType: "STREAK_DAYS" as const,
      unlockThreshold: 60,
      isStarterItem: false,
      sortOrder: 3,
    },
    {
      name: "Sunglasses",
      description: "Cool shades for cool warriors",
      category: "ACCESSORY" as const,
      spriteSheetPath: "/sprites/accessories/sunglasses.png",
      unlockConditionType: "MONSTERS_DEFEATED" as const,
      unlockThreshold: 2,
      isStarterItem: false,
      sortOrder: 4,
    },

    // WEAPONS
    {
      name: "Iron Sword",
      description: "Your first weapon",
      category: "WEAPON" as const,
      spriteSheetPath: "/sprites/weapon-sword.png",
      unlockConditionType: "STARTER_ITEM" as const,
      unlockThreshold: 0,
      isStarterItem: true,
      sortOrder: 1,
    },
    {
      name: "Battle Axe",
      description: "Heavy weapon for heavy hitters",
      category: "WEAPON" as const,
      spriteSheetPath: "/sprites/weapons/axe.png",
      unlockConditionType: "CHECK_IN_COUNT" as const,
      unlockThreshold: 15,
      isStarterItem: false,
      sortOrder: 2,
    },
    {
      name: "Staff",
      description: "Weapon of wisdom and focus",
      category: "WEAPON" as const,
      spriteSheetPath: "/sprites/weapons/staff.png",
      unlockConditionType: "FOCUS_POINTS" as const,
      unlockThreshold: 10,
      isStarterItem: false,
      sortOrder: 3,
    },
    {
      name: "Legendary Blade",
      description: "Only the most dedicated warriors earn this",
      category: "WEAPON" as const,
      spriteSheetPath: "/sprites/weapons/legendary.png",
      unlockConditionType: "STREAK_DAYS" as const,
      unlockThreshold: 90,
      isStarterItem: false,
      sortOrder: 4,
    },
  ];

  // Clear existing cosmetics first
  await prisma.cosmeticItem.deleteMany({});
  console.log("Cleared existing cosmetics\n");

  for (const cosmetic of cosmetics) {
    await prisma.cosmeticItem.create({
      data: cosmetic,
    });
    console.log(`✓ Seeded: ${cosmetic.name}`);
  }

  console.log("\n✅ Cosmetic seeding complete!");
  console.log(`Total items: ${cosmetics.length}`);
  console.log(`- Starter items: ${cosmetics.filter((c) => c.isStarterItem).length}`);
  console.log(`- Unlockable items: ${cosmetics.filter((c) => !c.isStarterItem).length}`);
}

seedCosmetics()
  .catch((e) => {
    console.error("Error seeding cosmetics:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
