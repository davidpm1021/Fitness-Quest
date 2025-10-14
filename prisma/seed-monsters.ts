import { PrismaClient, MonsterType } from "@prisma/client";

const prisma = new PrismaClient();

interface MonsterTemplate {
  name: string;
  description: string;
  monsterType: MonsterType;
  maxHp: number;
  armorClass: number;
  baseDamage: number[];
  counterattackChance: number;
}

// Monster stats by type (from SPRINT-PLAN.md):
// TANK: AC 10, HP 600, 20% counterattack
// BALANCED: AC 12, HP 400, 40% counterattack
// GLASS_CANNON: AC 15, HP 300, 60% counterattack

const monsters: MonsterTemplate[] = [
  // TANK Monsters
  {
    name: "The Couch Potato Golem",
    description:
      "A massive, lumbering creature made of old couch cushions and TV remotes. It moves slowly but has immense durability. Its favorite attack is the 'Netflix Binge Beam' that drains motivation.",
    monsterType: MonsterType.TANK,
    maxHp: 600,
    armorClass: 10,
    baseDamage: [3, 5],
    counterattackChance: 20,
  },
  {
    name: "Procrastination Dragon",
    description:
      "An ancient wyrm that feeds on delayed tasks and abandoned goals. Its scales are made of unread emails and expired gym memberships. Slow but incredibly resilient.",
    monsterType: MonsterType.TANK,
    maxHp: 600,
    armorClass: 10,
    baseDamage: [3, 5],
    counterattackChance: 20,
  },
  {
    name: "The Comfort Zone Colossus",
    description:
      "A towering giant wrapped in a blanket of complacency. It's hard to hurt because it's so well-padded with excuses and rationalizations.",
    monsterType: MonsterType.TANK,
    maxHp: 600,
    armorClass: 10,
    baseDamage: [3, 5],
    counterattackChance: 20,
  },

  // BALANCED Monsters
  {
    name: "The Social Media Siren",
    description:
      "A mesmerizing entity that constantly whispers 'just one more scroll.' It balances alluring distractions with punishing time-wasting attacks.",
    monsterType: MonsterType.BALANCED,
    maxHp: 400,
    armorClass: 12,
    baseDamage: [3, 5],
    counterattackChance: 40,
  },
  {
    name: "Excuse Generator 3000",
    description:
      "A mechanical beast that produces an endless supply of reasons not to work out. Neither too tough nor too fragile, but always annoying.",
    monsterType: MonsterType.BALANCED,
    maxHp: 400,
    armorClass: 12,
    baseDamage: [3, 5],
    counterattackChance: 40,
  },
  {
    name: "The Snooze Button Demon",
    description:
      "A mischievous fiend that appears every morning, whispering 'five more minutes.' It's moderately difficult to defeat and strikes back often.",
    monsterType: MonsterType.BALANCED,
    maxHp: 400,
    armorClass: 12,
    baseDamage: [3, 5],
    counterattackChance: 40,
  },
  {
    name: "Fast Food Phantom",
    description:
      "A ghostly apparition that smells like french fries and regret. Well-balanced in defense and counterattacks, making it a challenging foe.",
    monsterType: MonsterType.BALANCED,
    maxHp: 400,
    armorClass: 12,
    baseDamage: [3, 5],
    counterattackChance: 40,
  },

  // GLASS_CANNON Monsters
  {
    name: "The Anxiety Assassin",
    description:
      "A lightning-fast shadow that strikes with crippling self-doubt. Fragile but deadly, it counterattacks frequently with devastating psychological damage.",
    monsterType: MonsterType.GLASS_CANNON,
    maxHp: 300,
    armorClass: 15,
    baseDamage: [3, 5],
    counterattackChance: 60,
  },
  {
    name: "Burnout Banshee",
    description:
      "A wailing spirit that screams 'You're doing too much!' Very hard to hit, but shatters quickly under sustained pressure. Retaliates with exhaustion.",
    monsterType: MonsterType.GLASS_CANNON,
    maxHp: 300,
    armorClass: 15,
    baseDamage: [3, 5],
    counterattackChance: 60,
  },
  {
    name: "The Perfectionist Specter",
    description:
      "An elusive ghost that whispers 'It's not good enough yet.' Extremely difficult to land a hit on, but crumbles once you break through its defenses.",
    monsterType: MonsterType.GLASS_CANNON,
    maxHp: 300,
    armorClass: 15,
    baseDamage: [3, 5],
    counterattackChance: 60,
  },

  // Additional TANK Monsters
  {
    name: "The Inertia Behemoth",
    description:
      "A colossal stone giant that hasn't moved in years. It's incredibly hard to budge, representing the raw weight of old habits and routines that refuse to change.",
    monsterType: MonsterType.TANK,
    maxHp: 600,
    armorClass: 10,
    baseDamage: [3, 5],
    counterattackChance: 20,
  },

  // Additional BALANCED Monsters
  {
    name: "The Sugar Rush Cyclops",
    description:
      "A one-eyed giant fueled by energy drinks and candy bars. Its unpredictable energy spikes make it a formidable opponent with balanced stats.",
    monsterType: MonsterType.BALANCED,
    maxHp: 400,
    armorClass: 12,
    baseDamage: [3, 5],
    counterattackChance: 40,
  },
  {
    name: "The Tomorrow Thief",
    description:
      "A shadowy figure that steals your plans for 'starting tomorrow.' It's moderately tough and has a knack for striking back when you least expect it.",
    monsterType: MonsterType.BALANCED,
    maxHp: 400,
    armorClass: 12,
    baseDamage: [3, 5],
    counterattackChance: 40,
  },

  // Additional GLASS_CANNON Monsters
  {
    name: "The Comparison Wraith",
    description:
      "A wispy specter that shows you everyone else's highlight reel. Lightning-fast and evasive, but shatters under focused, consistent effort.",
    monsterType: MonsterType.GLASS_CANNON,
    maxHp: 300,
    armorClass: 15,
    baseDamage: [3, 5],
    counterattackChance: 60,
  },
  {
    name: "The All-or-Nothing Ninja",
    description:
      "A perfectionist assassin that demands 100% or nothing. Extremely hard to hit, but once you land a blow, it crumbles quickly.",
    monsterType: MonsterType.GLASS_CANNON,
    maxHp: 300,
    armorClass: 15,
    baseDamage: [3, 5],
    counterattackChance: 60,
  },
];

async function seedMonsters() {
  console.log("🌱 Seeding monsters...");

  for (const monster of monsters) {
    const existing = await prisma.monsters.findFirst({
      where: { name: monster.name },
    });

    if (!existing) {
      await prisma.monsters.create({
        data: {
          id: `mon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: monster.name,
          description: monster.description,
          monster_type: monster.monsterType,
          max_hp: monster.maxHp,
          current_hp: monster.maxHp,
          armor_class: monster.armorClass,
          base_damage: monster.baseDamage,
          counterattack_chance: monster.counterattackChance,
          is_defeated: false,
        },
      });
      console.log(`✅ Created monster: ${monster.name}`);
    } else {
      console.log(`⏭️  Monster already exists: ${monster.name}`);
    }
  }

  console.log("✨ Monster seeding complete!");
}

seedMonsters()
  .catch((e) => {
    console.error("❌ Error seeding monsters:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
