-- Fitness Quest - Initial Announcements
-- Run this to populate the announcements system with recent features and roadmap

-- Recently Completed Features (Last 5)

INSERT INTO feature_announcements (id, title, description, category, version, release_date, is_published, sort_order, created_at, updated_at)
VALUES
  -- 1. Battle Modifiers
  (
    'ann-battle-modifiers',
    'Battle Modifiers System Released!',
    'Every monster battle now features 2-3 random modifiers that change combat mechanics!

Positive modifiers like "Inspired" grant +2 damage, while negative modifiers like "Cursed" apply -2 to hit. Each battle feels unique with modifiers affecting damage, accuracy, defense, and counterattacks.

Look for the modifier indicators on the monster selection screen to plan your strategy!',
    'NEW_FEATURE',
    '1.1.0',
    NOW(),
    true,
    10,
    NOW(),
    NOW()
  ),

  -- 2. Monster Phases
  (
    'ann-monster-phases',
    'Dynamic Monster Difficulty System',
    'Monsters now adapt as battle progresses! Each monster has three distinct phases:

Phase 1 (100-75% HP): Normal behavior
Phase 2 (75-25% HP): Enhanced abilities unlock
Phase 3 (25-0% HP): Desperate and dangerous!

Tank monsters gain rage damage, Balanced monsters counterattack more, and Glass Cannons unleash devastating area attacks. Stay alert as the tide of battle shifts!',
    'NEW_FEATURE',
    '1.0.0',
    NOW(),
    true,
    20,
    NOW(),
    NOW()
  ),

  -- 3. Character Progression System
  (
    'ann-character-progression',
    'Full Character Progression System',
    'Your hero now grows stronger with every battle!

• Earn XP from check-ins and monster defeats
• Level up to unlock skill points
• Spend Focus Points on powerful abilities
• Choose from 3 skill trees: Combat, Support, and Utility

26 unique skills await, including powerful ultimates at higher levels. Will you become a damage dealer, a team healer, or a tactical genius?',
    'NEW_FEATURE',
    '1.0.0',
    NOW(),
    true,
    30,
    NOW(),
    NOW()
  ),

  -- 4. Welcome-Back System
  (
    'ann-welcome-back',
    'Welcome Back Bonus System',
    'Life happens, and we understand! If you miss 3+ days, we will welcome you back with open arms:

• +20 HP instant healing
• Next 3 check-ins deal +5 bonus damage
• 50% reduced counterattack damage for 3 days

No judgment, no penalties - just support to help you rejoin your party''s adventure!',
    'NEW_FEATURE',
    '1.0.0',
    NOW(),
    true,
    40,
    NOW(),
    NOW()
  ),

  -- 5. Enhanced Encouragement Defense
  (
    'ann-encouragement-defense',
    'Encouragements Now Grant Defense',
    'Your party''s support makes you stronger! Each encouragement you receive now grants +5 defense (max +25 from encouragements, +25 from streaks = 50 total).

React to your teammates'' attacks with 💪 🔥 ⭐ 👏 to boost their defense and help them survive monster counterattacks. Teamwork makes the dream work!',
    'IMPROVEMENT',
    '1.0.0',
    NOW(),
    true,
    50,
    NOW(),
    NOW()
  );

-- Coming Soon Features (Next 3)

INSERT INTO feature_announcements (id, title, description, category, version, release_date, is_published, sort_order, created_at, updated_at)
VALUES
  -- 1. Meta-Progression System
  (
    'ann-meta-progression',
    'Meta-Progression & Victory Tokens',
    'Permanent upgrades are coming that carry between monsters!

Earn Victory Tokens by defeating monsters, then spend them in the upgrade shop for:
• Max HP boosts (+10/20/30 HP)
• Permanent damage increases (+1/2/3)
• Starting focus bonuses (+2/4/6)
• Counterattack resistance (-1/2/3 damage)

Each monster defeated makes your party permanently stronger!',
    'COMING_SOON',
    NULL,
    NOW(),
    true,
    100,
    NOW(),
    NOW()
  ),

  -- 2. Healing Actions
  (
    'ann-healing-actions',
    'Healing Actions: Support Your Party',
    'Tactical healing is coming to help keep your party alive!

Two healing options will be available:
• Quick Heal: Restore 10 HP to an ally, keep your attack
• Deep Heal: Restore 20 HP to an ally, sacrifice your attack today

Strategic healing can mean the difference between victory and defeat. Will you take the offensive or play support?',
    'COMING_SOON',
    NULL,
    NOW(),
    true,
    110,
    NOW(),
    NOW()
  ),

  -- 3. Combat System Overhaul
  (
    'ann-combat-overhaul',
    'Combat System Refinement',
    'We are exploring improvements to make combat feel more rewarding and consistent!

The current D20 dice roll system can feel too random. We are considering changes that reward successful check-ins more reliably while maintaining strategic depth and excitement.

Your feedback matters! This system is core to the game experience, and we want to get it right. Let us know your thoughts as you play!',
    'COMING_SOON',
    NULL,
    NOW(),
    true,
    120,
    NOW(),
    NOW()
  );
