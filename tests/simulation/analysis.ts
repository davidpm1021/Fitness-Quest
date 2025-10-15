/**
 * Balance Analysis Tools
 *
 * Analyzes simulation results and identifies balance issues
 */

import { SimulationResult, RedFlag, BalanceAnalysis } from './game-simulation';

/**
 * Analyze simulation results for balance issues
 */
export function analyzeBalance(results: SimulationResult): BalanceAnalysis {
  const redFlags: RedFlag[] = [];
  const recommendations: string[] = [];

  // Check monster defeat speed
  if (results.monstersDefeated === 0) {
    redFlags.push({
      severity: 'HIGH',
      issue: 'No monsters defeated',
      metric: `0 monsters in ${results.durationDays} days`,
      recommendation: 'Reduce monster HP by 30-40% or increase player damage significantly',
    });
  } else if (results.averageDaysPerMonster < 7) {
    redFlags.push({
      severity: 'MEDIUM',
      issue: 'Monsters too easy',
      metric: `Average ${results.averageDaysPerMonster.toFixed(1)} days per monster (target: 8-15)`,
      recommendation: 'Increase monster HP by 20-30%',
    });
  } else if (results.averageDaysPerMonster > 20) {
    redFlags.push({
      severity: 'HIGH',
      issue: 'Monsters too difficult/grindy',
      metric: `Average ${results.averageDaysPerMonster.toFixed(1)} days per monster (target: 8-15)`,
      recommendation: 'Decrease monster HP by 20-30% or increase base damage',
    });
  } else if (results.averageDaysPerMonster > 15) {
    redFlags.push({
      severity: 'LOW',
      issue: 'Monsters slightly too difficult',
      metric: `Average ${results.averageDaysPerMonster.toFixed(1)} days per monster (target: 8-15)`,
      recommendation: 'Consider decreasing monster HP by 10-15%',
    });
  }

  // Check progression speed
  const avgLevel =
    results.players.reduce((sum, p) => sum + p.stats.finalLevel, 0) / results.players.length;

  if (avgLevel > 12) {
    redFlags.push({
      severity: 'MEDIUM',
      issue: 'Leveling too fast',
      metric: `Average level ${avgLevel.toFixed(1)} after ${results.durationDays} days (target: 6-9)`,
      recommendation: 'Reduce XP per check-in from 10 to 8, or adjust level formula',
    });
  } else if (avgLevel < 4) {
    redFlags.push({
      severity: 'HIGH',
      issue: 'Leveling too slow',
      metric: `Average level ${avgLevel.toFixed(1)} after ${results.durationDays} days (target: 6-9)`,
      recommendation: 'Increase XP per check-in from 10 to 12, or increase XP per goal',
    });
  } else if (avgLevel < 6) {
    redFlags.push({
      severity: 'LOW',
      issue: 'Leveling slightly slow',
      metric: `Average level ${avgLevel.toFixed(1)} after ${results.durationDays} days (target: 6-9)`,
      recommendation: 'Consider increasing XP per check-in by 1-2 points',
    });
  }

  // Check death rate
  const totalDeaths = results.players.reduce((sum, p) => sum + p.stats.deaths, 0);
  const avgDeaths = totalDeaths / results.players.length;

  if (avgDeaths > 3) {
    redFlags.push({
      severity: 'HIGH',
      issue: 'Too many player deaths',
      metric: `Average ${avgDeaths.toFixed(1)} deaths per player`,
      recommendation: 'Reduce counterattack chance or damage by 20-30%',
    });
  } else if (avgDeaths > 1) {
    redFlags.push({
      severity: 'LOW',
      issue: 'Occasional deaths occurring',
      metric: `Average ${avgDeaths.toFixed(1)} deaths per player`,
      recommendation: 'Monitor closely - deaths should be rare with consistent play',
    });
  }

  // Check solo viability (if solo party)
  if (results.partyConfig.includes('Solo') && results.monstersDefeated === 0) {
    redFlags.push({
      severity: 'HIGH',
      issue: 'Solo play impossible',
      metric: 'No monsters defeated in 60 days solo',
      recommendation: 'Reduce monster HP or add solo player damage bonus',
    });
  }

  // Check action diversity
  const totalActions = results.players.reduce(
    (sum, p) =>
      sum +
      p.stats.actionUsage.ATTACK +
      p.stats.actionUsage.DEFEND +
      p.stats.actionUsage.SUPPORT +
      p.stats.actionUsage.HEROIC_STRIKE,
    0
  );

  const attackPercentage =
    (results.players.reduce((sum, p) => sum + p.stats.actionUsage.ATTACK, 0) / totalActions) * 100;

  if (attackPercentage > 90) {
    redFlags.push({
      severity: 'MEDIUM',
      issue: 'No strategic diversity',
      metric: `${attackPercentage.toFixed(0)}% of actions are ATTACK`,
      recommendation: 'Increase value of DEFEND/SUPPORT/HEROIC_STRIKE or reduce focus costs',
    });
  }

  // Check encouragement engagement
  const totalEncouragements = results.players.reduce(
    (sum, p) => sum + p.stats.encouragementsSent,
    0
  );
  const avgEncouragements = totalEncouragements / results.players.length;

  if (avgEncouragements < 10 && results.players.length > 1) {
    recommendations.push(
      'Low encouragement usage - consider adding incentives or making encouragements more visible'
    );
  }

  // Check streak maintenance
  const avgMaxStreak =
    results.players.reduce((sum, p) => sum + p.stats.maxStreak, 0) / results.players.length;

  if (avgMaxStreak < 7) {
    recommendations.push(
      `Low average max streak (${avgMaxStreak.toFixed(1)} days) - consider adding streak maintenance rewards`
    );
  }

  // Check damage variance with multiple attacks
  const totalDamage = results.players.reduce((sum, p) => sum + p.stats.totalDamageDealt, 0);
  const totalCheckIns = results.players.reduce((sum, p) => sum + p.stats.totalCheckIns, 0);
  const avgDamagePerCheckIn = totalDamage / totalCheckIns;

  if (avgDamagePerCheckIn < 8) {
    recommendations.push(
      'Low average damage - multiple attacks system may need tuning (increase +1 modifier to +2)'
    );
  } else if (avgDamagePerCheckIn > 20) {
    recommendations.push(
      'High average damage - players may be too powerful (reduce +1 modifier or base damage)'
    );
  }

  // Generate summary
  const summary = generateSummary(results, redFlags);

  return {
    summary,
    redFlags,
    recommendations,
  };
}

/**
 * Generate summary text
 */
function generateSummary(results: SimulationResult, redFlags: RedFlag[]): string {
  const criticalFlags = redFlags.filter(f => f.severity === 'HIGH').length;
  const mediumFlags = redFlags.filter(f => f.severity === 'MEDIUM').length;
  const lowFlags = redFlags.filter(f => f.severity === 'LOW').length;

  if (criticalFlags > 0) {
    return `CRITICAL BALANCE ISSUES: ${criticalFlags} high-severity issues detected. Game needs significant tuning before release.`;
  }

  if (mediumFlags > 2) {
    return `MODERATE BALANCE ISSUES: ${mediumFlags} medium-severity issues detected. Game needs rebalancing.`;
  }

  if (mediumFlags > 0 || lowFlags > 0) {
    return `MINOR BALANCE ISSUES: ${mediumFlags} medium and ${lowFlags} low-severity issues detected. Game is playable but could use tuning.`;
  }

  return 'BALANCE HEALTHY: No critical issues detected. Game appears well-balanced for the target experience.';
}

/**
 * Compare two simulation results
 */
export function compareResults(
  before: SimulationResult,
  after: SimulationResult
): {
  improvements: string[];
  regressions: string[];
} {
  const improvements: string[] = [];
  const regressions: string[] = [];

  // Compare monster defeat speed
  if (after.averageDaysPerMonster < before.averageDaysPerMonster) {
    if (after.averageDaysPerMonster < 7) {
      regressions.push('Monsters now too easy (became faster to defeat)');
    } else {
      improvements.push(
        `Monsters defeat speed improved (${before.averageDaysPerMonster.toFixed(1)} → ${after.averageDaysPerMonster.toFixed(1)} days)`
      );
    }
  } else if (after.averageDaysPerMonster > before.averageDaysPerMonster) {
    if (after.averageDaysPerMonster > 20) {
      regressions.push('Monsters now too difficult (became slower to defeat)');
    } else {
      improvements.push(
        `Monsters more challenging (${before.averageDaysPerMonster.toFixed(1)} → ${after.averageDaysPerMonster.toFixed(1)} days)`
      );
    }
  }

  // Compare death rates
  const beforeDeaths =
    before.players.reduce((sum, p) => sum + p.stats.deaths, 0) / before.players.length;
  const afterDeaths =
    after.players.reduce((sum, p) => sum + p.stats.deaths, 0) / after.players.length;

  if (afterDeaths < beforeDeaths) {
    improvements.push(`Fewer deaths (${beforeDeaths.toFixed(1)} → ${afterDeaths.toFixed(1)})`);
  } else if (afterDeaths > beforeDeaths) {
    regressions.push(`More deaths (${beforeDeaths.toFixed(1)} → ${afterDeaths.toFixed(1)})`);
  }

  // Compare progression
  const beforeAvgLevel =
    before.players.reduce((sum, p) => sum + p.stats.finalLevel, 0) / before.players.length;
  const afterAvgLevel =
    after.players.reduce((sum, p) => sum + p.stats.finalLevel, 0) / after.players.length;

  const levelDiff = Math.abs(afterAvgLevel - beforeAvgLevel);
  if (levelDiff > 1) {
    if (afterAvgLevel > beforeAvgLevel) {
      if (afterAvgLevel > 12) {
        regressions.push(`Leveling too fast now (avg level ${afterAvgLevel.toFixed(1)})`);
      } else {
        improvements.push(
          `Faster progression (level ${beforeAvgLevel.toFixed(1)} → ${afterAvgLevel.toFixed(1)})`
        );
      }
    } else {
      if (afterAvgLevel < 4) {
        regressions.push(`Leveling too slow now (avg level ${afterAvgLevel.toFixed(1)})`);
      } else {
        improvements.push(
          `Slower progression (level ${beforeAvgLevel.toFixed(1)} → ${afterAvgLevel.toFixed(1)})`
        );
      }
    }
  }

  return { improvements, regressions };
}
