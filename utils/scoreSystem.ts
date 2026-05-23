/**
 * Score System — daily limits, subscription multipliers, activity milestones
 * Daily score limit: 200 pts (Free) / 250 pts (Basic 1.25×) / 350 pts (Ultra 1.75×)
 * Milestones: 20%=5, 40%=10, 60%=15, 80%=20, 100%=25 base pts
 * Multipliers: Free=1x, Basic=1.2x (+20%), Ultra=1.5x (+50%)
 */

export const DAILY_SCORE_LIMIT = 200;

/** Subscription daily score multipliers */
const DAILY_LIMIT_MULTIPLIERS: Record<string, number> = {
  FREE:  1.00,
  BASIC: 1.25,
  ULTRA: 1.75,
};

/** Dynamic daily score limit based on subscription + optional permanent limit boost */
export const getDailyScoreLimit = (
  subscriptionLevel?: string,
  isPremium?: boolean,
  scoreLimitBoostPercent?: number,
): number => {
  const mult = isPremium ? (DAILY_LIMIT_MULTIPLIERS[subscriptionLevel ?? 'FREE'] ?? 1.0) : 1.0;
  const base = Math.round(DAILY_SCORE_LIMIT * mult);
  if (scoreLimitBoostPercent && scoreLimitBoostPercent > 0) {
    return Math.round(base * (1 + scoreLimitBoostPercent / 100));
  }
  return base;
};

export const SCORE_MULTIPLIERS: Record<string, number> = {
  FREE:  1.0,
  BASIC: 1.2,
  ULTRA: 1.5,
};

export const PROGRESS_MILESTONES: { percent: number; score: number }[] = [
  { percent: 20,  score: 5  },
  { percent: 40,  score: 10 },
  { percent: 60,  score: 15 },
  { percent: 80,  score: 20 },
  { percent: 100, score: 25 },
];

const getTodayKey = (userId: string) => {
  const today = new Date().toISOString().split('T')[0];
  return `nst_daily_score_${userId}_${today}`;
};

export const getDailyScoreEarned = (userId: string): number => {
  try { return Number(localStorage.getItem(getTodayKey(userId)) || '0'); } catch { return 0; }
};

export const getRemainingDailyScore = (
  userId: string,
  subscriptionLevel?: string,
  isPremium?: boolean,
  scoreLimitBoostPercent?: number,
): number =>
  Math.max(0, getDailyScoreLimit(subscriptionLevel, isPremium, scoreLimitBoostPercent) - getDailyScoreEarned(userId));

/** Get active score boost % for a user (returns 0 if expired or not set) */
export const getActiveBoost = (user: { scoreBoostPercent?: number; scoreBoostExpiry?: string }): number => {
  if (!user.scoreBoostPercent || !user.scoreBoostExpiry) return 0;
  if (new Date(user.scoreBoostExpiry).getTime() <= Date.now()) return 0;
  return user.scoreBoostPercent;
};

/** Calculate final score with multiplier + booster */
export const calculateScore = (
  baseScore: number,
  subscriptionLevel: string | undefined,
  isPremium: boolean | undefined,
  boostPercent = 0,
): number => {
  const tier = isPremium ? (subscriptionLevel || 'FREE') : 'FREE';
  const mult = SCORE_MULTIPLIERS[tier] ?? 1.0;
  let s = Math.round(baseScore * mult);
  if (boostPercent > 0) s = Math.round(s * (1 + boostPercent / 100));
  return s;
};

/**
 * Attempt to earn score. Applies daily limit, multiplier, and booster.
 * Returns actual score earned (may be less than requested if near daily limit).
 */
export const tryEarnScore = (
  userId: string,
  baseScore: number,
  subscriptionLevel: string | undefined,
  isPremium: boolean | undefined,
  boostPercent = 0,
): number => {
  const remaining = getRemainingDailyScore(userId, subscriptionLevel, isPremium);
  if (remaining <= 0) return 0;
  const calc = calculateScore(baseScore, subscriptionLevel, isPremium, boostPercent);
  const actual = Math.min(calc, remaining);
  try {
    const key = getTodayKey(userId);
    const current = getDailyScoreEarned(userId);
    localStorage.setItem(key, String(current + actual));
  } catch {}
  return actual;
};

/**
 * Check which progress milestone was just hit.
 * Returns the base score + calculated score to award, or null if no milestone hit.
 */
export const checkMilestone = (
  prevPercent: number,
  newPercent: number,
  subscriptionLevel: string | undefined,
  isPremium: boolean | undefined,
  boostPercent = 0,
): { milestonePercent: number; baseScore: number; finalScore: number } | null => {
  for (const ms of PROGRESS_MILESTONES) {
    if (prevPercent < ms.percent && newPercent >= ms.percent) {
      return {
        milestonePercent: ms.percent,
        baseScore: ms.score,
        finalScore: calculateScore(ms.score, subscriptionLevel, isPremium, boostPercent),
      };
    }
  }
  return null;
};

/** Track which milestones have already been awarded for a given session (localStorage key) */
export const getMilestoneTrackerKey = (userId: string, sessionKey: string) =>
  `nst_ms_${userId}_${sessionKey}`;

/**
 * Check and award a milestone score for an activity session.
 * Returns earned score or 0 if already awarded / daily limit reached.
 * `sessionKey` uniquely identifies the content (e.g., `video_<id>`, `pdf_<id>`)
 */
export const awardMilestone = (
  userId: string,
  sessionKey: string,
  prevPercent: number,
  newPercent: number,
  subscriptionLevel: string | undefined,
  isPremium: boolean | undefined,
  boostPercent = 0,
): { earned: number; milestonePercent: number } | null => {
  const hit = checkMilestone(prevPercent, newPercent, subscriptionLevel, isPremium, boostPercent);
  if (!hit) return null;

  // Check if this milestone was already awarded this session
  const trackerKey = getMilestoneTrackerKey(userId, sessionKey);
  const awarded = new Set<number>(JSON.parse(localStorage.getItem(trackerKey) || '[]'));
  if (awarded.has(hit.milestonePercent)) return null;

  // Award it
  const earned = tryEarnScore(userId, hit.baseScore, subscriptionLevel, isPremium, boostPercent);
  if (earned > 0) {
    awarded.add(hit.milestonePercent);
    try { localStorage.setItem(trackerKey, JSON.stringify([...awarded])); } catch {}
  }
  return { earned, milestonePercent: hit.milestonePercent };
};

/** Reset milestone tracker for a session */
export const resetMilestoneTracker = (userId: string, sessionKey: string) => {
  try { localStorage.removeItem(getMilestoneTrackerKey(userId, sessionKey)); } catch {}
};
