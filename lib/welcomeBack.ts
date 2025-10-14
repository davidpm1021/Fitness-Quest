/**
 * Welcome-Back System
 *
 * Provides a positive, non-judgmental re-engagement experience for users
 * who have missed 3+ consecutive days of check-ins.
 *
 * Features:
 * - Auto-heal: +20 HP
 * - Catch-up bonus: Next 3 check-ins deal +5 extra damage
 * - Reduced counterattack: -50% counterattack damage for 3 check-ins
 * - Goal adjustment option: Allow users to reduce goals if needed
 */

import { prisma } from '@/lib/prisma';

export interface WelcomeBackStatus {
  isActive: boolean;
  checkInsRemaining: number;
  bonuses: {
    autoHealApplied: boolean;
    extraDamageBonus: number;
    counterattackReduction: number;
  };
}

export interface WelcomeBackEligibility {
  isEligible: boolean;
  daysMissed: number;
  lastCheckInDate: Date | null;
  reason?: string;
}

/**
 * Check if a party member is eligible for welcome-back benefits
 * Eligibility: Missed 3+ consecutive days
 */
export async function checkWelcomeBackEligibility(
  partyMemberId: string
): Promise<WelcomeBackEligibility> {
  try {
    // Get the most recent check-in
    const lastCheckIn = await prisma.check_ins.findFirst({
      where: {
        party_member_id: partyMemberId,
      },
      orderBy: {
        check_in_date: 'desc',
      },
      select: {
        check_in_date: true,
      },
    });

    if (!lastCheckIn) {
      // No check-ins yet - not eligible (they're brand new)
      return {
        isEligible: false,
        daysMissed: 0,
        lastCheckInDate: null,
        reason: 'No previous check-ins',
      };
    }

    // Calculate days since last check-in
    const lastDate = new Date(lastCheckIn.check_in_date);
    lastDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysSinceLastCheckIn = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if welcome-back buff is already active
    const partyMember = await prisma.party_members.findUnique({
      where: { id: partyMemberId },
      select: {
        welcome_back_active: true,
        welcome_back_remaining: true,
      },
    });

    // If buff is active, not eligible for a new one
    if (partyMember?.welcome_back_active && (partyMember?.welcome_back_remaining || 0) > 0) {
      return {
        isEligible: false,
        daysMissed: daysSinceLastCheckIn,
        lastCheckInDate: lastDate,
        reason: 'Welcome-back buff already active',
      };
    }

    // Eligible if missed 3+ days
    if (daysSinceLastCheckIn >= 3) {
      return {
        isEligible: true,
        daysMissed: daysSinceLastCheckIn,
        lastCheckInDate: lastDate,
      };
    }

    return {
      isEligible: false,
      daysMissed: daysSinceLastCheckIn,
      lastCheckInDate: lastDate,
      reason: 'Less than 3 days missed',
    };
  } catch (error) {
    console.error('Error checking welcome-back eligibility:', error);
    return {
      isEligible: false,
      daysMissed: 0,
      lastCheckInDate: null,
      reason: 'Error checking eligibility',
    };
  }
}

/**
 * Activate welcome-back benefits for a party member
 * - Auto-heal: +20 HP (capped at max HP)
 * - Set buff counters for next 3 check-ins
 */
export async function activateWelcomeBackBuff(partyMemberId: string): Promise<{
  success: boolean;
  newHp?: number;
  message?: string;
  error?: string;
}> {
  try {
    const partyMember = await prisma.party_members.findUnique({
      where: { id: partyMemberId },
      select: {
        current_hp: true,
        max_hp: true,
        welcome_back_active: true,
      },
    });

    if (!partyMember) {
      return {
        success: false,
        error: 'Party member not found',
      };
    }

    // Calculate new HP (auto-heal +20, capped at max)
    const currentHp = partyMember.current_hp || 0;
    const maxHp = partyMember.max_hp || 100;
    const healAmount = 20;
    const newHp = Math.min(currentHp + healAmount, maxHp);

    // Update party member with welcome-back buffs
    await prisma.party_members.update({
      where: { id: partyMemberId },
      data: {
        current_hp: newHp,
        welcome_back_active: true,
        welcome_back_remaining: 3, // 3 check-ins with bonuses
        welcome_back_activated_at: new Date(),
      },
    });

    return {
      success: true,
      newHp,
      message: `Welcome back! Healed for ${newHp - currentHp} HP. You have bonuses for your next 3 check-ins!`,
    };
  } catch (error) {
    console.error('Error activating welcome-back buff:', error);
    return {
      success: false,
      error: 'Failed to activate welcome-back buff',
    };
  }
}

/**
 * Get current welcome-back status for a party member
 */
export async function getWelcomeBackStatus(
  partyMemberId: string
): Promise<WelcomeBackStatus> {
  try {
    const partyMember = await prisma.party_members.findUnique({
      where: { id: partyMemberId },
      select: {
        welcome_back_active: true,
        welcome_back_remaining: true,
      },
    });

    if (!partyMember || !partyMember.welcome_back_active) {
      return {
        isActive: false,
        checkInsRemaining: 0,
        bonuses: {
          autoHealApplied: false,
          extraDamageBonus: 0,
          counterattackReduction: 0,
        },
      };
    }

    const remaining = partyMember.welcome_back_remaining || 0;

    return {
      isActive: remaining > 0,
      checkInsRemaining: remaining,
      bonuses: {
        autoHealApplied: true,
        extraDamageBonus: 5, // +5 damage per check-in
        counterattackReduction: 0.5, // 50% reduction in counterattack damage
      },
    };
  } catch (error) {
    console.error('Error getting welcome-back status:', error);
    return {
      isActive: false,
      checkInsRemaining: 0,
      bonuses: {
        autoHealApplied: false,
        extraDamageBonus: 0,
        counterattackReduction: 0,
      },
    };
  }
}

/**
 * Decrement welcome-back counter after a check-in
 * Should be called after each check-in while the buff is active
 */
export async function decrementWelcomeBackCounter(
  partyMemberId: string
): Promise<void> {
  try {
    const partyMember = await prisma.party_members.findUnique({
      where: { id: partyMemberId },
      select: {
        welcome_back_active: true,
        welcome_back_remaining: true,
      },
    });

    if (!partyMember?.welcome_back_active) {
      return; // No active buff
    }

    const remaining = (partyMember.welcome_back_remaining || 0) - 1;

    if (remaining <= 0) {
      // Buff expired, deactivate it
      await prisma.party_members.update({
        where: { id: partyMemberId },
        data: {
          welcome_back_active: false,
          welcome_back_remaining: 0,
        },
      });
    } else {
      // Decrement counter
      await prisma.party_members.update({
        where: { id: partyMemberId },
        data: {
          welcome_back_remaining: remaining,
        },
      });
    }
  } catch (error) {
    console.error('Error decrementing welcome-back counter:', error);
  }
}

/**
 * Dismiss welcome-back notification (user acknowledges it)
 * This doesn't deactivate the buff, just marks it as acknowledged
 */
export async function dismissWelcomeBackNotification(
  partyMemberId: string
): Promise<void> {
  try {
    await prisma.party_members.update({
      where: { id: partyMemberId },
      data: {
        welcome_back_acknowledged: true,
      },
    });
  } catch (error) {
    console.error('Error dismissing welcome-back notification:', error);
  }
}
