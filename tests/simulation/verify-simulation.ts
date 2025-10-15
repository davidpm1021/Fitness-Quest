/**
 * Simulation Verification Suite
 *
 * Rigorous testing to ensure simulation accurately represents real gameplay
 */

import { prisma } from '@/lib/prisma';
import { createTestParty, createMonster, simulateDay } from './game-simulation';
import { PARTY_CONFIGS, CASUAL } from './archetypes';
import {
  rollD20,
  rollBaseDamage,
  calculateAttackBonuses,
  calculateDamage,
  calculateDefense,
} from '@/lib/combat';

interface VerificationResult {
  test: string;
  passed: boolean;
  details: string;
  expected?: any;
  actual?: any;
}

const results: VerificationResult[] = [];

function addResult(test: string, passed: boolean, details: string, expected?: any, actual?: any) {
  results.push({ test, passed, details, expected, actual });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}`);
  if (!passed) {
    console.log(`   Expected: ${JSON.stringify(expected)}`);
    console.log(`   Actual: ${JSON.stringify(actual)}`);
  }
  console.log(`   ${details}\n`);
}

/**
 * TEST 1: Verify Monster HP Decreases Correctly
 */
async function testMonsterHPDecrease() {
  console.log('\n📋 TEST 1: Monster HP Decrease Verification\n');
  console.log('Creating test party with 1 Perfect Player...');

  const testId = `verify_hp_${Date.now()}`;
  const { partyId, players } = await createTestParty(
    { name: 'HP Test', archetypes: [PARTY_CONFIGS.STANDARD_4.archetypes[0]] },
    testId
  );

  console.log('Creating BALANCED monster (200 HP)...');
  const monsterId = await createMonster(partyId, 'BALANCED', testId);

  // Get initial monster HP
  const monsterBefore = await prisma.monsters.findUnique({
    where: { id: monsterId },
  });

  console.log(`Initial Monster HP: ${monsterBefore?.current_hp}/${monsterBefore?.max_hp}`);

  // Simulate day 1
  console.log('\nSimulating Day 1...');
  const baseDate = new Date();
  const snapshot1 = await simulateDay(1, partyId, players, baseDate);

  // Get monster HP after day 1
  const monsterAfterDay1 = await prisma.monsters.findUnique({
    where: { id: monsterId },
  });

  console.log(`Day 1 Damage: ${snapshot1.partyDamage}`);
  console.log(`Day 1 Snapshot HP: ${snapshot1.monsterHp}`);
  console.log(`Day 1 Database HP: ${monsterAfterDay1?.current_hp}`);

  // Verify snapshot matches database
  const snapshotMatchesDB = snapshot1.monsterHp === monsterAfterDay1?.current_hp;
  addResult(
    'Snapshot HP matches Database HP',
    snapshotMatchesDB,
    'After Day 1, snapshot should reflect actual database state',
    monsterAfterDay1?.current_hp,
    snapshot1.monsterHp
  );

  // Verify HP decreased by damage amount
  const expectedHP = (monsterBefore?.current_hp || 0) - snapshot1.partyDamage;
  const actualHP = monsterAfterDay1?.current_hp || 0;
  const hpCalculationCorrect = expectedHP === actualHP;
  addResult(
    'HP calculation correct',
    hpCalculationCorrect,
    `Monster HP should decrease by exactly the damage dealt`,
    expectedHP,
    actualHP
  );

  // Simulate day 2
  console.log('\nSimulating Day 2...');
  const snapshot2 = await simulateDay(2, partyId, players, baseDate);

  const monsterAfterDay2 = await prisma.monsters.findUnique({
    where: { id: monsterId },
  });

  console.log(`Day 2 Damage: ${snapshot2.partyDamage}`);
  console.log(`Day 2 Snapshot HP: ${snapshot2.monsterHp}`);
  console.log(`Day 2 Database HP: ${monsterAfterDay2?.current_hp}`);

  // Verify cumulative damage
  const totalDamage = snapshot1.partyDamage + snapshot2.partyDamage;
  const expectedDay2HP = Math.max(0, (monsterBefore?.current_hp || 0) - totalDamage);
  const actualDay2HP = monsterAfterDay2?.current_hp || 0;
  const cumulativeCorrect = expectedDay2HP === actualDay2HP;
  addResult(
    'Cumulative damage correct',
    cumulativeCorrect,
    `After 2 days, total damage should be ${totalDamage}`,
    expectedDay2HP,
    actualDay2HP
  );

  // Cleanup
  await cleanupTest(testId);
}

/**
 * TEST 2: Verify Combat Math Matches Production
 */
async function testCombatMath() {
  console.log('\n📋 TEST 2: Combat Math Verification\n');
  console.log('Testing combat calculations match production code...\n');

  // Test calculateDamage function
  const testRoll = 15;
  const testBonus = 5;
  const testBaseDamage = 4;
  const testAC = 12;

  const result = calculateDamage(testRoll, testBonus, testBaseDamage, testAC);

  console.log(`Roll: ${testRoll} + Bonus: ${testBonus} = ${testRoll + testBonus}`);
  console.log(`AC: ${testAC}`);
  console.log(`Result: ${result.hit ? 'HIT' : 'MISS'}, Damage: ${result.damage}`);

  // Should hit (20 >= 12)
  const hitCorrect = result.hit === true;
  addResult(
    'Hit calculation correct',
    hitCorrect,
    'Roll of 20 should hit AC 12',
    true,
    result.hit
  );

  // Damage should be base + bonus = 4 + 5 = 9
  const damageCorrect = result.damage === testBaseDamage + testBonus;
  addResult(
    'Damage calculation correct (hit)',
    damageCorrect,
    'On hit, damage = baseDamage + bonuses',
    testBaseDamage + testBonus,
    result.damage
  );

  // Test miss case - base damage still dealt
  const missResult = calculateDamage(5, 2, 4, 12);
  console.log(`\nMiss Test: Roll 5 + Bonus 2 = 7 vs AC 12`);
  console.log(`Result: ${missResult.hit ? 'HIT' : 'MISS'}, Damage: ${missResult.damage}`);

  const missCorrect = missResult.hit === false;
  addResult(
    'Miss calculation correct',
    missCorrect,
    'Roll of 7 should miss AC 12',
    false,
    missResult.hit
  );

  const baseDamageDealt = missResult.damage === testBaseDamage;
  addResult(
    'Base damage on miss',
    baseDamageDealt,
    'On miss, base damage still dealt',
    testBaseDamage,
    missResult.damage
  );
}

/**
 * TEST 3: Verify Multiple Attacks Implementation
 */
async function testMultipleAttacks() {
  console.log('\n📋 TEST 3: Multiple Attacks Verification\n');

  const testId = `verify_attacks_${Date.now()}`;
  const { partyId, players } = await createTestParty(
    { name: 'Attacks Test', archetypes: [PARTY_CONFIGS.STANDARD_4.archetypes[0]] },
    testId
  );

  const monsterId = await createMonster(partyId, 'BALANCED', testId);

  console.log('Simulating day with Perfect Player (should meet 5 goals)...\n');

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  const snapshot = await simulateDay(1, partyId, players, baseDate);

  // Calculate the check-in date (same as simulateDay does: baseDate + day)
  const checkInDate = new Date(baseDate);
  checkInDate.setDate(checkInDate.getDate() + 1);

  // Get the check-in record
  const checkIn = await prisma.check_ins.findFirst({
    where: {
      party_id: partyId,
      check_in_date: checkInDate,
    },
  });

  console.log(`Goals Met: ${checkIn?.goals_met}`);
  console.log(`Damage Dealt: ${checkIn?.damage_dealt}`);
  console.log(`Snapshot Damage: ${snapshot.partyDamage}`);

  // Perfect player should meet 5 goals (from archetype definition)
  const goalsCorrect = (checkIn?.goals_met || 0) >= 4; // Allow for RNG
  addResult(
    'Perfect Player goals met',
    goalsCorrect,
    'Perfect archetype should meet most/all goals',
    5,
    checkIn?.goals_met
  );

  // Damage should be recorded correctly
  const damageMatch = checkIn?.damage_dealt === snapshot.partyDamage;
  addResult(
    'Check-in damage matches snapshot',
    damageMatch,
    'Database record should match snapshot',
    snapshot.partyDamage,
    checkIn?.damage_dealt
  );

  // With 5 goals met = 5 attacks, damage should be substantial (>30 likely)
  const damageReasonable = (checkIn?.damage_dealt || 0) > 20;
  addResult(
    'Multiple attacks damage reasonable',
    damageReasonable,
    '5 goals met (5 attacks) should deal >20 damage',
    '>20',
    checkIn?.damage_dealt
  );

  await cleanupTest(testId);
}

/**
 * TEST 4: Verify XP and Leveling
 */
async function testXPandLeveling() {
  console.log('\n📋 TEST 4: XP and Leveling Verification\n');

  const testId = `verify_xp_${Date.now()}`;
  const { partyId, players } = await createTestParty(
    { name: 'XP Test', archetypes: [PARTY_CONFIGS.STANDARD_4.archetypes[0]] },
    testId
  );

  const monsterId = await createMonster(partyId, 'BALANCED', testId);

  const baseDate = new Date();

  // Get initial XP
  const playerBefore = await prisma.party_members.findUnique({
    where: { id: players[0].partyMemberId },
  });

  console.log(`Initial: Level ${playerBefore?.level}, XP ${playerBefore?.xp}`);

  // Simulate 20 days (Perfect player earns 20 XP/day, needs 400 XP for level 2)
  for (let day = 1; day <= 20; day++) {
    await simulateDay(day, partyId, players, baseDate);
  }

  const playerAfter = await prisma.party_members.findUnique({
    where: { id: players[0].partyMemberId },
  });

  console.log(`After 20 days: Level ${playerAfter?.level}, XP ${playerAfter?.xp}`);

  // XP should have increased
  const xpIncreased = (playerAfter?.xp || 0) > (playerBefore?.xp || 0);
  addResult(
    'XP increases over time',
    xpIncreased,
    'Player XP should increase with check-ins',
    `>${playerBefore?.xp}`,
    playerAfter?.xp
  );

  // Perfect player: 20 XP/day * 20 days = 400 XP minimum (plus monster victories)
  // 400 XP = Level 2, so should be at least level 2
  const levelCorrect = (playerAfter?.level || 0) >= 2;
  addResult(
    'Leveling occurs',
    levelCorrect,
    'Player should level up after earning enough XP (400 XP = Level 2)',
    '>=2',
    playerAfter?.level
  );

  await cleanupTest(testId);
}

/**
 * TEST 5: Verify Monster Defeat and Victory XP
 */
async function testMonsterDefeat() {
  console.log('\n📋 TEST 5: Monster Defeat Verification\n');

  const testId = `verify_defeat_${Date.now()}`;
  const { partyId, players } = await createTestParty(
    { name: 'Defeat Test', archetypes: [PARTY_CONFIGS.STANDARD_4.archetypes[0]] },
    testId
  );

  // Create a GLASS_CANNON monster (150 HP - easier to defeat)
  const monsterId = await createMonster(partyId, 'GLASS_CANNON', testId);

  console.log('Created GLASS_CANNON monster (150 HP)');
  console.log('Simulating until defeat...\n');

  const baseDate = new Date();
  let day = 1;
  let defeated = false;

  while (day <= 10 && !defeated) {
    const snapshot = await simulateDay(day, partyId, players, baseDate);
    console.log(`Day ${day}: Monster HP ${snapshot.monsterHp}/${snapshot.monsterMaxHp}, Damage ${snapshot.partyDamage}`);

    if (snapshot.monsterHp === 0) {
      defeated = true;
      console.log(`\n✅ Monster defeated on day ${day}!\n`);
    }
    day++;
  }

  addResult(
    'Monster defeated within reasonable time',
    defeated,
    'GLASS_CANNON (150 HP) should be defeated by Perfect Player in <10 days',
    true,
    defeated
  );

  if (defeated) {
    // Check monster is_defeated flag
    const monster = await prisma.monsters.findUnique({
      where: { id: monsterId },
    });

    const defeatFlagSet = monster?.is_defeated === true;
    addResult(
      'is_defeated flag set',
      defeatFlagSet,
      'Monster database record should be marked defeated',
      true,
      monster?.is_defeated
    );

    // Check party_monster is_active flag
    const partyMonster = await prisma.party_monsters.findFirst({
      where: { monster_id: monsterId },
    });

    const inactiveFlagSet = partyMonster?.is_active === false;
    addResult(
      'is_active flag unset',
      inactiveFlagSet,
      'Party monster should be marked inactive',
      false,
      partyMonster?.is_active
    );
  }

  await cleanupTest(testId);
}

/**
 * TEST 6: Verify Archetype Behavior
 */
async function testArchetypeBehavior() {
  console.log('\n📋 TEST 6: Archetype Behavior Verification\n');

  const testId = `verify_archetype_${Date.now()}`;

  // Test PERFECT archetype (100% check-in rate)
  const { partyId: perfectParty, players: perfectPlayers } = await createTestParty(
    { name: 'Perfect Test', archetypes: [PARTY_CONFIGS.STANDARD_4.archetypes[0]] },
    testId + '_perfect'
  );

  await createMonster(perfectParty, 'BALANCED', testId + '_perfect');

  const baseDate = new Date();
  for (let day = 1; day <= 10; day++) {
    await simulateDay(day, perfectParty, perfectPlayers, baseDate);
  }

  const perfectCheckIns = perfectPlayers[0].checkIns.filter(ci => ci).length;
  const perfectRate = perfectCheckIns / 10;

  console.log(`Perfect Player: ${perfectCheckIns}/10 check-ins (${(perfectRate * 100).toFixed(0)}%)`);

  const perfectCorrect = perfectRate === 1.0;
  addResult(
    'Perfect archetype check-in rate',
    perfectCorrect,
    'Perfect Player should check in 100% of days',
    1.0,
    perfectRate
  );

  await cleanupTest(testId + '_perfect');

  // Test CASUAL archetype (~60% check-in rate)
  const { partyId: casualParty, players: casualPlayers } = await createTestParty(
    { name: 'Casual Test', archetypes: [CASUAL] },
    testId + '_casual'
  );

  await createMonster(casualParty, 'BALANCED', testId + '_casual');

  for (let day = 1; day <= 30; day++) {
    await simulateDay(day, casualParty, casualPlayers, baseDate);
  }

  const casualCheckIns = casualPlayers[0].checkIns.filter(ci => ci).length;
  const casualRate = casualCheckIns / 30;

  console.log(`Casual Player: ${casualCheckIns}/30 check-ins (${(casualRate * 100).toFixed(0)}%)`);

  // Allow 20% variance for RNG (60% target, accept 50-80%)
  const casualCorrect = casualRate >= 0.5 && casualRate <= 0.8;
  addResult(
    'Casual archetype check-in rate',
    casualCorrect,
    'Casual Player should check in ~60% of days (50-80% acceptable for RNG variance)',
    '0.50-0.80',
    casualRate.toFixed(2)
  );

  await cleanupTest(testId + '_casual');
}

/**
 * Cleanup test data
 */
async function cleanupTest(testId: string) {
  await prisma.encouragements.deleteMany({
    where: {
      OR: [
        { from_user_id: { contains: testId } },
        {
          party_members: {
            user_id: { contains: testId },
          },
        },
      ],
    },
  });

  await prisma.check_ins.deleteMany({
    where: {
      party_members: {
        user_id: { contains: testId },
      },
    },
  });

  await prisma.party_monsters.deleteMany({
    where: {
      party_id: { contains: testId },
    },
  });

  await prisma.monsters.deleteMany({
    where: {
      id: { contains: testId },
    },
  });

  await prisma.goals.deleteMany({
    where: {
      user_id: { contains: testId },
    },
  });

  await prisma.party_members.deleteMany({
    where: {
      user_id: { contains: testId },
    },
  });

  await prisma.parties.deleteMany({
    where: {
      id: { contains: testId },
    },
  });

  await prisma.users.deleteMany({
    where: {
      id: { contains: testId },
    },
  });
}

/**
 * Main verification suite
 */
async function main() {
  console.log('🔬 SIMULATION VERIFICATION SUITE\n');
  console.log('═'.repeat(60));
  console.log('Running comprehensive tests to verify simulation accuracy...');
  console.log('═'.repeat(60));

  try {
    await testMonsterHPDecrease();
    await testCombatMath();
    await testMultipleAttacks();
    await testXPandLeveling();
    await testMonsterDefeat();
    await testArchetypeBehavior();

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('═'.repeat(60) + '\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ VERIFICATION FAILED');
      console.log('The simulation has accuracy issues that must be fixed.\n');
      console.log('Failed Tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.test}`);
        console.log(`    ${r.details}`);
      });
      process.exit(1);
    } else {
      console.log('✅ VERIFICATION PASSED');
      console.log('The simulation accurately represents real gameplay!');
      console.log('You can trust the balance results.\n');
    }
  } catch (error) {
    console.error('Verification error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { main as runVerification };
