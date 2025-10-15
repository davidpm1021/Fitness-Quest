/**
 * Main Simulation Runner
 *
 * Run this file to execute game balance simulations
 */

import {
  createTestParty,
  createMonster,
  simulateDay,
  cleanupSimulation,
  SimulationPlayer,
  SimulationResult,
  DailySnapshot,
} from './game-simulation';
import { PARTY_CONFIGS } from './archetypes';
import { analyzeBalance } from './analysis';
import { prisma } from '@/lib/prisma';

/**
 * Simulate N days of gameplay
 */
export async function simulate60Days(config: {
  partyConfig: typeof PARTY_CONFIGS.STANDARD_4;
  monsterSequence?: Array<'TANK' | 'BALANCED' | 'GLASS_CANNON'>;
  durationDays?: number;
}): Promise<SimulationResult> {
  const durationDays = config.durationDays || 60;
  const monsterSequence = config.monsterSequence || ['BALANCED', 'TANK', 'GLASS_CANNON', 'BALANCED'];
  const testId = `test_${Date.now()}`;

  console.log(`\n🎮 Starting ${durationDays}-day simulation...`);
  console.log(`Party: ${config.partyConfig.name}`);
  console.log(`Archetypes: ${config.partyConfig.archetypes.map(a => a.name).join(', ')}\n`);

  try {
    // Create party
    const { partyId, players } = await createTestParty(config.partyConfig, testId);

    // Create first monster
    let currentMonsterIndex = 0;
    let currentMonsterId = await createMonster(
      partyId,
      monsterSequence[currentMonsterIndex % monsterSequence.length],
      testId
    );

    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const dailySnapshots: DailySnapshot[] = [];
    let monstersDefeated = 0;
    let totalDaysForMonsters = 0;

    // Simulate each day
    for (let day = 1; day <= durationDays; day++) {
      process.stdout.write(`\rDay ${day}/${durationDays}... `);

      const snapshot = await simulateDay(day, partyId, players, baseDate);
      dailySnapshots.push(snapshot);

      // Check if monster defeated
      if (snapshot.monsterHp === 0 && snapshot.monsterMaxHp > 0) {
        monstersDefeated++;
        console.log(`\n✅ Monster ${monstersDefeated} defeated on day ${day}!`);

        // Calculate days for this monster
        const previousDefeat = dailySnapshots
          .slice(0, -1)
          .reverse()
          .find(s => s.monsterHp === 0);
        const daysForThisMonster = previousDefeat
          ? day - dailySnapshots.findIndex(s => s === previousDefeat)
          : day;
        totalDaysForMonsters += daysForThisMonster;

        // Grant victory XP to all players
        const victoryXP = snapshot.monsterMaxHp === 300 ? 100 : snapshot.monsterMaxHp === 200 ? 75 : 50;
        for (const player of players) {
          const partyMember = await prisma.party_members.findUnique({
            where: { id: player.partyMemberId },
          });
          if (partyMember) {
            const newXP = partyMember.xp + victoryXP;
            const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
            await prisma.party_members.update({
              where: { id: player.partyMemberId },
              data: {
                xp: newXP,
                level: newLevel,
                focus_points: 10, // Full focus on victory
              },
            });
          }
        }

        // Create next monster if we have days remaining
        if (day < durationDays) {
          currentMonsterIndex++;
          currentMonsterId = await createMonster(
            partyId,
            monsterSequence[currentMonsterIndex % monsterSequence.length],
            testId
          );
        }
      }
    }

    console.log(`\n\n✅ Simulation complete!\n`);

    // Get final player stats
    for (const player of players) {
      const partyMember = await prisma.party_members.findUnique({
        where: { id: player.partyMemberId },
      });
      if (partyMember) {
        player.stats.finalLevel = partyMember.level;
        player.stats.finalXP = partyMember.xp;
        player.stats.finalSkillPoints = partyMember.skill_points;
        player.stats.currentStreak = partyMember.current_streak;
      }
    }

    const result: SimulationResult = {
      partyConfig: config.partyConfig.name,
      durationDays,
      monstersDefeated,
      averageDaysPerMonster: monstersDefeated > 0 ? totalDaysForMonsters / monstersDefeated : 0,
      players,
      dailySnapshots,
      analysis: {
        summary: '',
        redFlags: [],
        recommendations: [],
      },
    };

    // Analyze balance
    result.analysis = analyzeBalance(result);

    // Print report
    printReport(result);

    // Cleanup
    await cleanupSimulation(testId);

    return result;
  } catch (error) {
    console.error('Simulation error:', error);
    await cleanupSimulation(testId);
    throw error;
  }
}

/**
 * Print simulation report to console
 */
function printReport(result: SimulationResult): void {
  console.log('='.repeat(60));
  console.log(`SIMULATION RESULTS: ${result.durationDays} Days`);
  console.log('='.repeat(60));
  console.log();
  console.log(`Party: ${result.partyConfig}`);
  console.log(`Monsters Defeated: ${result.monstersDefeated}`);
  console.log(`Average Days per Monster: ${result.averageDaysPerMonster.toFixed(1)}`);
  console.log();

  console.log('PLAYER PROGRESSION:');
  console.log('-'.repeat(60));
  for (const player of result.players) {
    const checkInRate = ((player.stats.totalCheckIns / result.durationDays) * 100).toFixed(0);
    console.log(
      `${player.archetype.name.padEnd(20)} | ` +
        `Level ${player.stats.finalLevel} | ` +
        `${player.stats.finalXP} XP | ` +
        `${player.stats.finalSkillPoints} SP | ` +
        `${checkInRate}% Check-in`
    );
  }
  console.log();

  console.log('COMBAT STATS:');
  console.log('-'.repeat(60));
  const totalDamage = result.players.reduce((sum, p) => sum + p.stats.totalDamageDealt, 0);
  const avgDamage = totalDamage / result.players.reduce((sum, p) => sum + p.stats.totalCheckIns, 0);
  console.log(`Average Damage per Check-in: ${avgDamage.toFixed(1)}`);

  const totalDeaths = result.players.reduce((sum, p) => sum + p.stats.deaths, 0);
  console.log(`Party Deaths: ${totalDeaths}`);

  const totalActions = result.players.reduce(
    (sum, p) =>
      sum +
      p.stats.actionUsage.ATTACK +
      p.stats.actionUsage.DEFEND +
      p.stats.actionUsage.SUPPORT +
      p.stats.actionUsage.HEROIC_STRIKE,
    0
  );

  console.log(`\nAction Usage:`);
  console.log(
    `  ATTACK: ${((result.players.reduce((sum, p) => sum + p.stats.actionUsage.ATTACK, 0) / totalActions) * 100).toFixed(0)}%`
  );
  console.log(
    `  DEFEND: ${((result.players.reduce((sum, p) => sum + p.stats.actionUsage.DEFEND, 0) / totalActions) * 100).toFixed(0)}%`
  );
  console.log(
    `  SUPPORT: ${((result.players.reduce((sum, p) => sum + p.stats.actionUsage.SUPPORT, 0) / totalActions) * 100).toFixed(0)}%`
  );
  console.log(
    `  HEROIC_STRIKE: ${((result.players.reduce((sum, p) => sum + p.stats.actionUsage.HEROIC_STRIKE, 0) / totalActions) * 100).toFixed(0)}%`
  );
  console.log();

  // Balance analysis
  if (result.analysis.redFlags.length > 0) {
    console.log('⚠️  BALANCE RED FLAGS:');
    console.log('-'.repeat(60));
    for (const flag of result.analysis.redFlags) {
      console.log(`[${flag.severity}] ${flag.issue}`);
      console.log(`  Metric: ${flag.metric}`);
      console.log(`  Fix: ${flag.recommendation}`);
      console.log();
    }
  }

  if (result.analysis.redFlags.length === 0) {
    console.log('✅ BALANCE HEALTHY:');
    console.log('-'.repeat(60));
    console.log('  - Progression feels satisfying');
    console.log('  - Combat stays challenging');
    console.log('  - No critical balance issues detected');
    console.log();
  }

  if (result.analysis.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    console.log('-'.repeat(60));
    for (const rec of result.analysis.recommendations) {
      console.log(`  - ${rec}`);
    }
    console.log();
  }

  console.log('='.repeat(60));
}

/**
 * Main entry point
 */
async function main() {
  console.log('🎮 Fitness Quest - Game Balance Simulation\n');

  // Scenario 2: Progression Speed (Standard 4-player party)
  console.log('Running Scenario: Progression Speed\n');
  await simulate60Days({
    partyConfig: PARTY_CONFIGS.STANDARD_4,
    monsterSequence: ['BALANCED', 'BALANCED', 'BALANCED', 'BALANCED'],
    durationDays: 60,
  });

  await prisma.$disconnect();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
