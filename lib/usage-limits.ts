/**
 * Usage limits for free vs pro tiers
 *
 * Free tier: 5 edits per day
 * Pro tier: Unlimited edits
 */

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
}

/**
 * Check if user can perform an edit
 */
export function checkUsageLimit(): UsageCheckResult {
  if (typeof window === 'undefined') {
    return {
      allowed: true,
      remaining: USAGE_LIMITS.FREE_DAILY_LIMIT,
      limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
      resetsAt: getNextResetTime(),
      isPro: false,
    };
  }

  // Check if user is pro (from localStorage for now)
  const isPro = localStorage.getItem('is_pro') === 'true';

  if (isPro) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetsAt: getNextResetTime(),
      isPro: true,
    };
  }

  // Get usage data
  const today = new Date().toDateString();
  const usageData = getUsageData();

  // Reset counter if it's a new day
  if (usageData.date !== today) {
    const newUsageData: UsageData = {
      date: today,
      count: 0,
      isPro: false,
    };
    setUsageData(newUsageData);

    return {
      allowed: true,
      remaining: USAGE_LIMITS.FREE_DAILY_LIMIT,
      limit: USAGE_LIMITS.FREE_DAILY_LIMIT,
      resetsAt: getNextResetTime(),
      isPro: false,
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
  };
}

/**
 * Increment usage count after successful edit
 */
export function incrementUsageCount(): void {
  if (typeof window === 'undefined') return;

  const usageData = getUsageData();
  const today = new Date().toDateString();

  if (usageData.date !== today) {
    // New day, reset
    setUsageData({
      date: today,
      count: 1,
      isPro: usageData.isPro,
    });
  } else {
    // Same day, increment
    setUsageData({
      ...usageData,
      count: usageData.count + 1,
    });
  }
}

/**
 * Set pro status
 */
export function setProStatus(isPro: boolean): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('is_pro', isPro ? 'true' : 'false');

  const usageData = getUsageData();
  setUsageData({
    ...usageData,
    isPro,
  });
}

/**
 * Check if user is pro
 */
export function isProUser(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('is_pro') === 'true';
}

/**
 * Get usage data from localStorage
 */
function getUsageData(): UsageData {
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
 * Set usage data in localStorage
 */
function setUsageData(data: UsageData): void {
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
