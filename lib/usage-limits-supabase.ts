/**
 * Usage limits for free vs pro tiers (with Supabase support)
 *
 * Free tier: 5 edits per day
 * Pro tier: Unlimited edits
 *
 * Works in two modes:
 * 1. Guest (localStorage) - for unauthenticated users
 * 2. Authenticated (Supabase) - for signed-in users
 */

import { createClient } from '@/lib/supabase/client';

export const USAGE_LIMITS = {
  FREE_DAILY_LIMIT: 5,
  PRO_DAILY_LIMIT: Infinity,
} as const;

export interface UsageData {
  date: string;
  count: number;
  isPro: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetsAt: Date;
  isPro: boolean;
  isAuthenticated: boolean;
}

/**
 * Check if user can perform an edit
 * Works for both guest (localStorage) and authenticated (Supabase) users
 */
export async function checkUsageLimit(userId?: string | null, userIsPro?: boolean): Promise<UsageCheckResult> {
  // If user is authenticated
  if (userId) {
    return await checkAuthenticatedUsage(userId, userIsPro || false);
  }

  // Guest user - use localStorage
  return checkGuestUsage();
}

/**
 * Check usage for authenticated user (from Supabase)
 */
async function checkAuthenticatedUsage(userId: string, isPro: boolean): Promise<UsageCheckResult> {
  // Pro users have unlimited
  if (isPro) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetsAt: getNextResetTime(),
      isPro: true,
      isAuthenticated: true,
    };
  }

  // Get usage from Supabase
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_daily_usage', {
      user_uuid: userId
    });

    if (error) {
      console.error('[UsageLimits] Error fetching usage:', error);
      // Fallback to allowing on error (better UX than blocking)
      return {
        allowed: true,
        remaining: USAGE_LIMITS.FREE_DAILY_LIMIT,
        limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
        resetsAt: getNextResetTime(),
        isPro: false,
        isAuthenticated: true,
      };
    }

    const count = data || 0;
    const allowed = count < USAGE_LIMITS.FREE_DAILY_LIMIT;
    const remaining = Math.max(0, USAGE_LIMITS.FREE_DAILY_LIMIT - count);

    return {
      allowed,
      remaining,
      limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
      resetsAt: getNextResetTime(),
      isPro: false,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('[UsageLimits] Unexpected error:', error);
    return {
      allowed: true,
      remaining: USAGE_LIMITS.FREE_DAILY_LIMIT,
      limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
      resetsAt: getNextResetTime(),
      isPro: false,
      isAuthenticated: true,
    };
  }
}

/**
 * Check usage for guest user (from localStorage)
 */
function checkGuestUsage(): UsageCheckResult {
  if (typeof window === 'undefined') {
    return {
      allowed: true,
      remaining: USAGE_LIMITS.FREE_DAILY_LIMIT,
      limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
      resetsAt: getNextResetTime(),
      isPro: false,
      isAuthenticated: false,
    };
  }

  const today = new Date().toDateString();
  const usageData = getLocalUsageData();

  // Reset counter if it's a new day
  if (usageData.date !== today) {
    const newUsageData: UsageData = {
      date: today,
      count: 0,
      isPro: false,
    };
    setLocalUsageData(newUsageData);

    return {
      allowed: true,
      remaining: USAGE_LIMITS.FREE_DAILY_LIMIT,
      limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
      resetsAt: getNextResetTime(),
      isPro: false,
      isAuthenticated: false,
    };
  }

  // Check if limit exceeded
  const allowed = usageData.count < USAGE_LIMITS.FREE_DAILY_LIMIT;
  const remaining = Math.max(0, USAGE_LIMITS.FREE_DAILY_LIMIT - usageData.count);

  return {
    allowed,
    remaining,
    limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
    resetsAt: getNextResetTime(),
    isPro: false,
    isAuthenticated: false,
  };
}

/**
 * Increment usage count after successful edit
 */
export async function incrementUsageCount(userId?: string | null): Promise<void> {
  if (userId) {
    // Authenticated user - log to Supabase
    try {
      const supabase = createClient();
      await supabase.from('usage_logs').insert({
        user_id: userId,
        action: 'edit',
      });
    } catch (error) {
      console.error('[UsageLimits] Failed to log usage:', error);
    }
  } else {
    // Guest user - increment localStorage
    if (typeof window === 'undefined') return;

    const usageData = getLocalUsageData();
    const today = new Date().toDateString();

    if (usageData.date !== today) {
      // New day, reset
      setLocalUsageData({
        date: today,
        count: 1,
        isPro: false,
      });
    } else {
      // Same day, increment
      setLocalUsageData({
        ...usageData,
        count: usageData.count + 1,
      });
    }
  }
}

/**
 * Get usage data from localStorage (guest users)
 */
function getLocalUsageData(): UsageData {
  if (typeof window === 'undefined') {
    return {
      date: new Date().toDateString(),
      count: 0,
      isPro: false,
    };
  }

  try {
    const stored = localStorage.getItem('usage_data');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[UsageLimits] Failed to parse usage data:', e);
  }

  return {
    date: new Date().toDateString(),
    count: 0,
    isPro: false,
  };
}

/**
 * Set usage data in localStorage (guest users)
 */
function setLocalUsageData(data: UsageData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('usage_data', JSON.stringify(data));
  } catch (e) {
    console.error('[UsageLimits] Failed to save usage data:', e);
  }
}

/**
 * Get next reset time (midnight tonight)
 */
function getNextResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow;
}

/**
 * Format time until reset
 */
export function formatTimeUntilReset(resetsAt: Date): string {
  const now = new Date();
  const diff = resetsAt.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
