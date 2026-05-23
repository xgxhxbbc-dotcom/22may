export interface LevelInfo {
  level: number;
  minScore: number;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  glowColor: string;
  discount: number;
}

export const LEVEL_INFO: LevelInfo[] = [
  { level: 1, minScore: 0,     label: 'Beginner',   emoji: '🌱', color: '#64748b', gradient: 'from-slate-500 to-slate-600',               glowColor: 'rgba(100,116,139,0.6)', discount: 0  },
  { level: 2, minScore: 100,   label: 'Apprentice', emoji: '✨', color: '#06b6d4', gradient: 'from-cyan-400 to-sky-500',                   glowColor: 'rgba(6,182,212,0.7)',   discount: 5  },
  { level: 3, minScore: 300,   label: 'Scholar',    emoji: '⚡', color: '#3b82f6', gradient: 'from-blue-400 to-indigo-500',                glowColor: 'rgba(59,130,246,0.7)',  discount: 10 },
  { level: 4, minScore: 700,   label: 'Expert',     emoji: '🔥', color: '#f97316', gradient: 'from-orange-400 to-red-500',                 glowColor: 'rgba(249,115,22,0.7)',  discount: 15 },
  { level: 5, minScore: 2000,  label: 'Master',     emoji: '💎', color: '#a855f7', gradient: 'from-violet-400 to-purple-600',              glowColor: 'rgba(168,85,247,0.7)',  discount: 20 },
  { level: 6, minScore: 5000,  label: 'Elite',      emoji: '🌟', color: '#eab308', gradient: 'from-yellow-400 to-amber-500',               glowColor: 'rgba(234,179,8,0.7)',   discount: 25 },
  { level: 7, minScore: 10000, label: 'Champion',   emoji: '👑', color: '#f59e0b', gradient: 'from-amber-400 to-orange-400',               glowColor: 'rgba(245,158,11,0.7)',  discount: 27 },
  { level: 8, minScore: 20000, label: 'Legend',     emoji: '🏆', color: '#10b981', gradient: 'from-emerald-400 via-cyan-400 to-violet-500', glowColor: 'rgba(16,185,129,0.7)',  discount: 30 },
];

export const MAX_LEVEL = 8;
export const LEVEL_THRESHOLDS = LEVEL_INFO.map(l => l.minScore);

export const getLevelInfo = (score: number): LevelInfo => {
  let info = LEVEL_INFO[0];
  for (const l of LEVEL_INFO) {
    if (score >= l.minScore) info = l;
    else break;
  }
  return info;
};

export const getLevelFromScore = (score: number): number => getLevelInfo(score).level;

export const getScoreDiscountFromScore = (score: number): number => getLevelInfo(score).discount;

export const getScoreForLevel = (level: number): number => {
  const idx = Math.max(0, Math.min(level - 1, MAX_LEVEL - 1));
  return LEVEL_INFO[idx].minScore;
};

export const getScoreAfterLevelDrop = (score: number): number => {
  const currentLevel = getLevelFromScore(score);
  if (currentLevel <= 1) return 0;
  return getScoreForLevel(currentLevel - 1);
};

export const getNextLevelInfo = (score: number): LevelInfo | null => {
  const current = getLevelInfo(score);
  if (current.level >= MAX_LEVEL) return null;
  return LEVEL_INFO[current.level] ?? null;
};

export const getLevelProgress = (score: number): number => {
  const current = getLevelInfo(score);
  const next = getNextLevelInfo(score);
  if (!next) return 100;
  const range = next.minScore - current.minScore;
  const gained = score - current.minScore;
  return Math.min(100, Math.round((gained / range) * 100));
};

export const ACTIVITY_SCORES = {
  VIDEO: 4,
  PDF: 3,
  MCQ_PER_ANSWER: 2,
  AUDIO: 2,
  NOTES_READ: 2,
  TTS: 3,
  DAILY_LOGIN: 10,
  REDEEM_CODE: 5,
  GIFT_CLAIM: 5,
  CREDIT_SPEND: 1,
  SUBSCRIPTION_ANY: 100,
};

// Score + bonusCredits per subscription tier/level
export const SUBSCRIPTION_BONUS: Record<string, { score: number; bonusCredits: number }> = {
  'WEEKLY_BASIC':    { score: 100, bonusCredits: 30 },
  'WEEKLY_ULTRA':    { score: 100, bonusCredits: 50 },
  'MONTHLY_BASIC':   { score: 100, bonusCredits: 150 },
  'MONTHLY_ULTRA':   { score: 100, bonusCredits: 250 },
  '3_MONTHLY_BASIC': { score: 100, bonusCredits: 500 },
  '3_MONTHLY_ULTRA': { score: 100, bonusCredits: 800 },
  'YEARLY_BASIC':    { score: 100, bonusCredits: 2100 },
  'YEARLY_ULTRA':    { score: 100, bonusCredits: 3500 },
  'LIFETIME_BASIC':  { score: 100, bonusCredits: 0 },
  'LIFETIME_ULTRA':  { score: 100, bonusCredits: 0 },
};
