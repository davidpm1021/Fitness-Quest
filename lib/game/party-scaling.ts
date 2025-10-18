/**
 * Party Size Scaling Utilities
 *
 * Dynamically adjusts monster difficulty based on party size to ensure
 * the game is balanced whether playing solo or with a full 8-person party.
 */

/**
 * Calculate scaled monster HP based on party size
 *
 * Formula: finalHP = baseHP * (1 + (partySize - 4) * 0.25)
 *
 * Examples:
 * - Solo (1 player): 0.25x HP
 * - 2 players: 0.5x HP
 * - 3 players: 0.75x HP
 * - 4 players: 1.0x HP (baseline)
 * - 5 players: 1.25x HP
 * - 6 players: 1.5x HP
 * - 7 players: 1.75x HP
 * - 8 players: 2.0x HP
 *
 * @param baseHp - The monster's base HP value (from seed data)
 * @param partySize - Number of active party members
 * @returns Scaled HP value rounded to nearest integer
 */
export function calculateScaledMonsterHp(
  baseHp: number,
  partySize: number
): number {
  // Baseline is 4 players
  const baseline = 4;

  // Each additional/fewer player changes HP by 25%
  const scalingFactor = 0.25;

  // Calculate multiplier
  const multiplier = 1 + (partySize - baseline) * scalingFactor;

  // Return scaled HP (minimum 1)
  return Math.max(1, Math.round(baseHp * multiplier));
}

/**
 * Get a description of the scaling applied for UI display
 *
 * @param partySize - Number of active party members
 * @returns Human-readable description of the scaling
 */
export function getScalingDescription(partySize: number): string {
  if (partySize === 1) {
    return "25% HP (Solo Quest)";
  } else if (partySize === 2) {
    return "50% HP (Duo)";
  } else if (partySize === 3) {
    return "75% HP (Trio)";
  } else if (partySize === 4) {
    return "100% HP (Standard)";
  } else if (partySize === 5) {
    return "125% HP (Large Party)";
  } else if (partySize === 6) {
    return "150% HP (Large Party)";
  } else if (partySize === 7) {
    return "175% HP (Epic Party)";
  } else if (partySize === 8) {
    return "200% HP (Epic Party)";
  } else {
    return "Unknown";
  }
}

/**
 * Calculate the HP multiplier for a given party size
 *
 * @param partySize - Number of active party members
 * @returns Multiplier value (e.g., 0.25 for solo, 1.0 for 4 players, 2.0 for 8 players)
 */
export function getHpMultiplier(partySize: number): number {
  const baseline = 4;
  const scalingFactor = 0.25;
  return 1 + (partySize - baseline) * scalingFactor;
}
