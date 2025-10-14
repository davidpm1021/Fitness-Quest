// prisma/seed-skills.ts
// Seed script for skill trees and skills

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding skill trees and skills...');

  // Create Warrior skill tree
  const warriorTree = await prisma.skill_trees.upsert({
    where: { name: 'Warrior' },
    update: {},
    create: {
      id: 'tree_warrior',
      name: 'Warrior',
      description: 'Master of offense and raw damage. Deal devastating blows and crush your enemies.',
      icon: '⚔️',
      color: '#dc2626', // red-600
      sort_order: 1,
    },
  });

  // Create Guardian skill tree
  const guardianTree = await prisma.skill_trees.upsert({
    where: { name: 'Guardian' },
    update: {},
    create: {
      id: 'tree_guardian',
      name: 'Guardian',
      description: 'Protector of the party. Tank damage and shield your allies from harm.',
      icon: '🛡️',
      color: '#2563eb', // blue-600
      sort_order: 2,
    },
  });

  // Create Healer skill tree
  const healerTree = await prisma.skill_trees.upsert({
    where: { name: 'Healer' },
    update: {},
    create: {
      id: 'tree_healer',
      name: 'Healer',
      description: 'Support specialist. Keep your party healthy and provide crucial buffs.',
      icon: '💚',
      color: '#16a34a', // green-600
      sort_order: 3,
    },
  });

  // ========== WARRIOR SKILLS ==========
  console.log('Creating Warrior skills...');

  // Tier 1: Level 2
  await prisma.skills.upsert({
    where: { id: 'warrior_power_strike' },
    update: {},
    create: {
      id: 'warrior_power_strike',
      skill_tree_id: warriorTree.id,
      name: 'Power Strike',
      description: 'Your attacks deal +10% damage',
      tier: 1,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'DAMAGE_BOOST',
      effect_value: 0.1,
      required_level: 2,
    },
  });

  await prisma.skills.upsert({
    where: { id: 'warrior_combat_focus' },
    update: {},
    create: {
      id: 'warrior_combat_focus',
      skill_tree_id: warriorTree.id,
      name: 'Combat Focus',
      description: 'Gain +1 max focus points',
      tier: 1,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'FOCUS_MAX_BOOST',
      effect_value: 1,
      required_level: 2,
    },
  });

  // Tier 2: Level 4
  await prisma.skills.upsert({
    where: { id: 'warrior_precision' },
    update: {},
    create: {
      id: 'warrior_precision',
      skill_tree_id: warriorTree.id,
      name: 'Precision',
      description: '+5% critical hit chance',
      tier: 2,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'CRITICAL_CHANCE',
      effect_value: 0.05,
      required_level: 4,
      prerequisite_skill_id: 'warrior_power_strike',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'warrior_battle_rage' },
    update: {},
    create: {
      id: 'warrior_battle_rage',
      skill_tree_id: warriorTree.id,
      name: 'Battle Rage',
      description: 'Your attacks deal +15% damage',
      tier: 2,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'DAMAGE_BOOST',
      effect_value: 0.15,
      required_level: 4,
      prerequisite_skill_id: 'warrior_power_strike',
    },
  });

  // Tier 3: Level 6
  await prisma.skills.upsert({
    where: { id: 'warrior_relentless' },
    update: {},
    create: {
      id: 'warrior_relentless',
      skill_tree_id: warriorTree.id,
      name: 'Relentless',
      description: 'Your attacks deal +20% damage',
      tier: 3,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'DAMAGE_BOOST',
      effect_value: 0.2,
      required_level: 6,
      prerequisite_skill_id: 'warrior_battle_rage',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'warrior_momentum' },
    update: {},
    create: {
      id: 'warrior_momentum',
      skill_tree_id: warriorTree.id,
      name: 'Momentum',
      description: '+10% bonus XP from all sources',
      tier: 3,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'XP_BOOST',
      effect_value: 0.1,
      required_level: 6,
    },
  });

  // Tier 4: Level 8
  await prisma.skills.upsert({
    where: { id: 'warrior_devastation' },
    update: {},
    create: {
      id: 'warrior_devastation',
      skill_tree_id: warriorTree.id,
      name: 'Devastation',
      description: '+10% critical hit chance',
      tier: 4,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'CRITICAL_CHANCE',
      effect_value: 0.1,
      required_level: 8,
      prerequisite_skill_id: 'warrior_precision',
    },
  });

  // Tier 5: Level 10
  await prisma.skills.upsert({
    where: { id: 'warrior_titan' },
    update: {},
    create: {
      id: 'warrior_titan',
      skill_tree_id: warriorTree.id,
      name: 'Titan\'s Fury',
      description: 'Your attacks deal +30% damage. Your party deals +5% damage.',
      tier: 5,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'DAMAGE_BOOST',
      effect_value: 0.3,
      required_level: 10,
      prerequisite_skill_id: 'warrior_relentless',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'warrior_inspire' },
    update: {},
    create: {
      id: 'warrior_inspire',
      skill_tree_id: warriorTree.id,
      name: 'Inspiring Presence',
      description: 'Your party deals +10% bonus damage',
      tier: 5,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'TEAM_DAMAGE_BOOST',
      effect_value: 0.1,
      required_level: 10,
      prerequisite_skill_id: 'warrior_devastation',
    },
  });

  // ========== GUARDIAN SKILLS ==========
  console.log('Creating Guardian skills...');

  // Tier 1: Level 2
  await prisma.skills.upsert({
    where: { id: 'guardian_fortify' },
    update: {},
    create: {
      id: 'guardian_fortify',
      skill_tree_id: guardianTree.id,
      name: 'Fortify',
      description: 'Gain +5 defense permanently',
      tier: 1,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'DEFENSE_BOOST',
      effect_value: 5,
      required_level: 2,
    },
  });

  await prisma.skills.upsert({
    where: { id: 'guardian_vitality' },
    update: {},
    create: {
      id: 'guardian_vitality',
      skill_tree_id: guardianTree.id,
      name: 'Vitality',
      description: 'Increase max HP by 20',
      tier: 1,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'MAX_HP_BOOST',
      effect_value: 20,
      required_level: 2,
    },
  });

  // Tier 2: Level 4
  await prisma.skills.upsert({
    where: { id: 'guardian_stalwart' },
    update: {},
    create: {
      id: 'guardian_stalwart',
      skill_tree_id: guardianTree.id,
      name: 'Stalwart',
      description: 'Reduce counterattack damage by 15%',
      tier: 2,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'COUNTERATTACK_REDUCTION',
      effect_value: 0.15,
      required_level: 4,
      prerequisite_skill_id: 'guardian_fortify',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'guardian_endurance' },
    update: {},
    create: {
      id: 'guardian_endurance',
      skill_tree_id: guardianTree.id,
      name: 'Endurance',
      description: 'Increase max HP by 30',
      tier: 2,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'MAX_HP_BOOST',
      effect_value: 30,
      required_level: 4,
      prerequisite_skill_id: 'guardian_vitality',
    },
  });

  // Tier 3: Level 6
  await prisma.skills.upsert({
    where: { id: 'guardian_shield_master' },
    update: {},
    create: {
      id: 'guardian_shield_master',
      skill_tree_id: guardianTree.id,
      name: 'Shield Master',
      description: 'Gain +10 defense permanently',
      tier: 3,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'DEFENSE_BOOST',
      effect_value: 10,
      required_level: 6,
      prerequisite_skill_id: 'guardian_fortify',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'guardian_resilience' },
    update: {},
    create: {
      id: 'guardian_resilience',
      skill_tree_id: guardianTree.id,
      name: 'Resilience',
      description: 'Reduce counterattack damage by 25%',
      tier: 3,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'COUNTERATTACK_REDUCTION',
      effect_value: 0.25,
      required_level: 6,
      prerequisite_skill_id: 'guardian_stalwart',
    },
  });

  // Tier 4: Level 8
  await prisma.skills.upsert({
    where: { id: 'guardian_iron_will' },
    update: {},
    create: {
      id: 'guardian_iron_will',
      skill_tree_id: guardianTree.id,
      name: 'Iron Will',
      description: 'Increase max HP by 50',
      tier: 4,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'MAX_HP_BOOST',
      effect_value: 50,
      required_level: 8,
      prerequisite_skill_id: 'guardian_endurance',
    },
  });

  // Tier 5: Level 10
  await prisma.skills.upsert({
    where: { id: 'guardian_aegis' },
    update: {},
    create: {
      id: 'guardian_aegis',
      skill_tree_id: guardianTree.id,
      name: 'Aegis',
      description: 'Gain +15 defense. Your party gains +5 defense.',
      tier: 5,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'DEFENSE_BOOST',
      effect_value: 15,
      required_level: 10,
      prerequisite_skill_id: 'guardian_shield_master',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'guardian_protector' },
    update: {},
    create: {
      id: 'guardian_protector',
      skill_tree_id: guardianTree.id,
      name: 'Protector',
      description: 'Your party gains +10 defense permanently',
      tier: 5,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'TEAM_DEFENSE_BOOST',
      effect_value: 10,
      required_level: 10,
      prerequisite_skill_id: 'guardian_aegis',
    },
  });

  // ========== HEALER SKILLS ==========
  console.log('Creating Healer skills...');

  // Tier 1: Level 2
  await prisma.skills.upsert({
    where: { id: 'healer_gentle_touch' },
    update: {},
    create: {
      id: 'healer_gentle_touch',
      skill_tree_id: healerTree.id,
      name: 'Gentle Touch',
      description: 'Your heals restore +15% more HP',
      tier: 1,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'HEALING_BOOST',
      effect_value: 0.15,
      required_level: 2,
    },
  });

  await prisma.skills.upsert({
    where: { id: 'healer_focus_regen' },
    update: {},
    create: {
      id: 'healer_focus_regen',
      skill_tree_id: healerTree.id,
      name: 'Meditation',
      description: 'Regenerate +1 additional focus per check-in',
      tier: 1,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'FOCUS_REGEN',
      effect_value: 1,
      required_level: 2,
    },
  });

  // Tier 2: Level 4
  await prisma.skills.upsert({
    where: { id: 'healer_blessing' },
    update: {},
    create: {
      id: 'healer_blessing',
      skill_tree_id: healerTree.id,
      name: 'Blessing',
      description: 'Your heals restore +25% more HP',
      tier: 2,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'HEALING_BOOST',
      effect_value: 0.25,
      required_level: 4,
      prerequisite_skill_id: 'healer_gentle_touch',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'healer_empathy' },
    update: {},
    create: {
      id: 'healer_empathy',
      skill_tree_id: healerTree.id,
      name: 'Empathy',
      description: 'When you check in, heal all party members for 5 HP',
      tier: 2,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'HP_BOOST',
      effect_value: 5,
      required_level: 4,
    },
  });

  // Tier 3: Level 6
  await prisma.skills.upsert({
    where: { id: 'healer_restoration' },
    update: {},
    create: {
      id: 'healer_restoration',
      skill_tree_id: healerTree.id,
      name: 'Restoration',
      description: 'Your heals restore +40% more HP',
      tier: 3,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'HEALING_BOOST',
      effect_value: 0.4,
      required_level: 6,
      prerequisite_skill_id: 'healer_blessing',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'healer_aura' },
    update: {},
    create: {
      id: 'healer_aura',
      skill_tree_id: healerTree.id,
      name: 'Healing Aura',
      description: 'When you check in, heal all party members for 10 HP',
      tier: 3,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'HP_BOOST',
      effect_value: 10,
      required_level: 6,
      prerequisite_skill_id: 'healer_empathy',
    },
  });

  // Tier 4: Level 8
  await prisma.skills.upsert({
    where: { id: 'healer_life_bond' },
    update: {},
    create: {
      id: 'healer_life_bond',
      skill_tree_id: healerTree.id,
      name: 'Life Bond',
      description: 'Increase your max HP by 30 and party max HP by +10',
      tier: 4,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'MAX_HP_BOOST',
      effect_value: 30,
      required_level: 8,
    },
  });

  // Tier 5: Level 10
  await prisma.skills.upsert({
    where: { id: 'healer_sanctuary' },
    update: {},
    create: {
      id: 'healer_sanctuary',
      skill_tree_id: healerTree.id,
      name: 'Sanctuary',
      description: 'Your heals restore +60% more HP',
      tier: 5,
      position: 0,
      skill_type: 'PASSIVE',
      effect_type: 'HEALING_BOOST',
      effect_value: 0.6,
      required_level: 10,
      prerequisite_skill_id: 'healer_restoration',
    },
  });

  await prisma.skills.upsert({
    where: { id: 'healer_guardian_angel' },
    update: {},
    create: {
      id: 'healer_guardian_angel',
      skill_tree_id: healerTree.id,
      name: 'Guardian Angel',
      description: 'Streak protection: losing a streak no longer resets your bonuses',
      tier: 5,
      position: 1,
      skill_type: 'PASSIVE',
      effect_type: 'STREAK_PROTECTION',
      effect_value: 1,
      required_level: 10,
      prerequisite_skill_id: 'healer_sanctuary',
    },
  });

  console.log('✅ Skill trees and skills seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding skills:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
