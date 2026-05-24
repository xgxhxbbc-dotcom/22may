export interface LevelInfo {
  level: number;
  minScore: number;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  glowColor: string;
  discount: number;
  animationIntensity: 0 | 1 | 2 | 3 | 4; // 0=none, 1=subtle, 2=medium, 3=strong, 4=legendary
  nameColor?: string; // color for username display (levels 7+)
}

export const LEVEL_INFO: LevelInfo[] = [
  { level: 1,  minScore: 0,       label: 'Beginner',    emoji: '🌱', color: '#94a3b8', gradient: 'from-slate-400 to-slate-500',                glowColor: 'rgba(148,163,184,0.35)', discount: 0,  animationIntensity: 0 },
  { level: 2,  minScore: 200,     label: 'Apprentice',  emoji: '🌿', color: '#6ee7b7', gradient: 'from-emerald-300 to-teal-400',               glowColor: 'rgba(110,231,183,0.35)', discount: 0,  animationIntensity: 0 },
  { level: 3,  minScore: 500,     label: 'Explorer',    emoji: '🔍', color: '#38bdf8', gradient: 'from-sky-400 to-cyan-500',                   glowColor: 'rgba(56,189,248,0.4)',   discount: 2,  animationIntensity: 1 },
  { level: 4,  minScore: 1000,    label: 'Scholar',     emoji: '✨', color: '#06b6d4', gradient: 'from-cyan-400 to-sky-500',                   glowColor: 'rgba(6,182,212,0.45)',   discount: 3,  animationIntensity: 1 },
  { level: 5,  minScore: 5000,    label: 'Expert',      emoji: '⚡', color: '#3b82f6', gradient: 'from-blue-400 to-indigo-500',                glowColor: 'rgba(59,130,246,0.5)',   discount: 5,  animationIntensity: 2 },
  { level: 6,  minScore: 10000,   label: 'Veteran',     emoji: '🔥', color: '#f97316', gradient: 'from-orange-400 to-red-500',                 glowColor: 'rgba(249,115,22,0.55)',  discount: 8,  animationIntensity: 2 },
  { level: 7,  minScore: 20000,   label: 'Master',      emoji: '💫', color: '#a855f7', gradient: 'from-violet-400 to-purple-600',              glowColor: 'rgba(168,85,247,0.6)',   discount: 10, animationIntensity: 2, nameColor: '#a855f7' },
  { level: 8,  minScore: 50000,   label: 'GrandMaster', emoji: '💎', color: '#f59e0b', gradient: 'from-amber-400 to-yellow-500',               glowColor: 'rgba(245,158,11,0.65)',  discount: 13, animationIntensity: 3, nameColor: '#f59e0b' },
  { level: 9,  minScore: 1000000, label: 'Titan',       emoji: '🌟', color: '#eab308', gradient: 'from-yellow-400 to-amber-500',               glowColor: 'rgba(234,179,8,0.75)',   discount: 17, animationIntensity: 3, nameColor: '#eab308' },
  { level: 10, minScore: 2000000, label: 'Mythic',      emoji: '👑', color: '#f59e0b', gradient: 'from-amber-400 to-orange-400',               glowColor: 'rgba(245,158,11,0.8)',   discount: 20, animationIntensity: 3, nameColor: '#f59e0b' },
  { level: 11, minScore: 5000000, label: 'Supreme',     emoji: '🏆', color: '#10b981', gradient: 'from-emerald-400 via-cyan-400 to-violet-500', glowColor: 'rgba(16,185,129,0.9)',  discount: 20, animationIntensity: 4, nameColor: '#10b981' },
];

export const MAX_LEVEL = 11;
export const LEVEL_THRESHOLDS = LEVEL_INFO.map(l => l.minScore);

// ── Level-based daily limit bonuses ────────────────────────────────────────
export interface LevelLimitBonus {
  mcqBonus: number;           // Extra MCQ practice per day
  writeFreeBonus: number;     // Extra free Write Mode sessions per day
  dlBonus: number;            // Extra HTML downloads per day
  videoFreeBonus: number;     // Extra free video sessions per day
  pdfFreeBonus: number;       // Extra free PDF sessions per day
  creditWriteMax: number;     // Max credit-paid Write Mode sessions per day
  bonusLoginCredits: number;  // Extra CR on daily login
}

export const getLevelLimitBonus = (level: number): LevelLimitBonus => {
  const tbl: Record<number, LevelLimitBonus> = {
    1:  { mcqBonus: 0,  writeFreeBonus: 0,  dlBonus: 0,  videoFreeBonus: 0,  pdfFreeBonus: 0,  creditWriteMax: 100, bonusLoginCredits: 0  },
    2:  { mcqBonus: 0,  writeFreeBonus: 0,  dlBonus: 0,  videoFreeBonus: 0,  pdfFreeBonus: 0,  creditWriteMax: 100, bonusLoginCredits: 0  },
    3:  { mcqBonus: 1,  writeFreeBonus: 0,  dlBonus: 0,  videoFreeBonus: 0,  pdfFreeBonus: 0,  creditWriteMax: 100, bonusLoginCredits: 0  },
    4:  { mcqBonus: 1,  writeFreeBonus: 1,  dlBonus: 1,  videoFreeBonus: 1,  pdfFreeBonus: 1,  creditWriteMax: 100, bonusLoginCredits: 10 },
    5:  { mcqBonus: 2,  writeFreeBonus: 2,  dlBonus: 2,  videoFreeBonus: 2,  pdfFreeBonus: 2,  creditWriteMax: 100, bonusLoginCredits: 15 },
    6:  { mcqBonus: 3,  writeFreeBonus: 3,  dlBonus: 3,  videoFreeBonus: 3,  pdfFreeBonus: 3,  creditWriteMax: 100, bonusLoginCredits: 20 },
    7:  { mcqBonus: 5,  writeFreeBonus: 5,  dlBonus: 5,  videoFreeBonus: 5,  pdfFreeBonus: 5,  creditWriteMax: 100, bonusLoginCredits: 25 },
    8:  { mcqBonus: 7,  writeFreeBonus: 7,  dlBonus: 7,  videoFreeBonus: 7,  pdfFreeBonus: 7,  creditWriteMax: 110, bonusLoginCredits: 35 },
    9:  { mcqBonus: 10, writeFreeBonus: 10, dlBonus: 10, videoFreeBonus: 10, pdfFreeBonus: 10, creditWriteMax: 120, bonusLoginCredits: 50 },
    10: { mcqBonus: 13, writeFreeBonus: 13, dlBonus: 13, videoFreeBonus: 13, pdfFreeBonus: 13, creditWriteMax: 130, bonusLoginCredits: 70 },
    11: { mcqBonus: 15, writeFreeBonus: 15, dlBonus: 15, videoFreeBonus: 15, pdfFreeBonus: 15, creditWriteMax: 150, bonusLoginCredits: 100},
  };
  const lvl = Math.min(MAX_LEVEL, Math.max(1, level));
  return tbl[lvl] ?? tbl[1];
};

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

// Returns TopBarEffects config array based on level animation intensity
export const getLevelTopBarEffects = (lvl: LevelInfo): Array<{id:string;enabled:boolean;color:string;speed?:number;opacity?:number}> => {
  const c = lvl.color;
  const g = lvl.glowColor;
  switch (lvl.animationIntensity) {
    case 0: return []; // Level 1-2 — no effects
    case 1: // Level 3-4 — very subtle shimmer only
      return [
        { id: 'shimmer-forward', enabled: true, color: c, speed: 3, opacity: 0.3 },
      ];
    case 2: // Level 5-7 — shimmer + glow
      return [
        { id: 'shimmer-forward', enabled: true, color: c, speed: 2, opacity: 0.5 },
        { id: 'glow-bottom',     enabled: true, color: g, speed: 1.5, opacity: 0.6 },
      ];
    case 3: // Level 8-10 — shimmer + glow + sparkles
      return [
        { id: 'shimmer-forward', enabled: true, color: c, speed: 1.5 },
        { id: 'shimmer-reverse', enabled: true, color: c, speed: 2 },
        { id: 'glow-both',       enabled: true, color: g, speed: 1 },
        { id: 'sparkle-top',     enabled: true, color: c, speed: 1 },
      ];
    case 4: // Level 11 — LEGENDARY — all effects max
      return [
        { id: 'shimmer-forward', enabled: true, color: c, speed: 1 },
        { id: 'shimmer-reverse', enabled: true, color: c, speed: 1.2 },
        { id: 'glow-both',       enabled: true, color: g, speed: 0.8 },
        { id: 'sparkle-full',    enabled: true, color: c, speed: 0.8 },
        { id: 'sparkle-top',     enabled: true, color: '#fbbf24', speed: 1.2 },
      ];
    default: return [];
  }
};
