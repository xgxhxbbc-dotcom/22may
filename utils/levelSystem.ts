export interface LevelInfo {
  level: number;
  minScore: number;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  glowColor: string;
  discount: number;
  animationIntensity: 0 | 1 | 2 | 3 | 4;
  nameColor?: string;
}

export const LEVEL_INFO: LevelInfo[] = [
  { level: 1,  minScore: 0,       label: 'Beginner',    emoji: '🌱', color: '#94a3b8', gradient: 'from-slate-400 to-slate-500',                glowColor: 'rgba(148,163,184,0.35)', discount: 0,  animationIntensity: 0 },
  { level: 2,  minScore: 200,     label: 'Apprentice',  emoji: '🌿', color: '#6ee7b7', gradient: 'from-emerald-300 to-teal-400',               glowColor: 'rgba(110,231,183,0.35)', discount: 0,  animationIntensity: 0 },
  { level: 3,  minScore: 500,     label: 'Explorer',    emoji: '🔍', color: '#38bdf8', gradient: 'from-sky-400 to-cyan-500',                   glowColor: 'rgba(56,189,248,0.4)',   discount: 2,  animationIntensity: 1 },
  { level: 4,  minScore: 1000,    label: 'Scholar',     emoji: '✨', color: '#06b6d4', gradient: 'from-cyan-400 to-sky-500',                   glowColor: 'rgba(6,182,212,0.45)',   discount: 3,  animationIntensity: 1, nameColor: '#06b6d4' },
  { level: 5,  minScore: 5000,    label: 'Expert',      emoji: '⚡', color: '#3b82f6', gradient: 'from-blue-400 to-indigo-500',                glowColor: 'rgba(59,130,246,0.5)',   discount: 5,  animationIntensity: 2 },
  { level: 6,  minScore: 10000,   label: 'Veteran',     emoji: '🔥', color: '#f97316', gradient: 'from-orange-400 to-red-500',                 glowColor: 'rgba(249,115,22,0.55)',  discount: 8,  animationIntensity: 2 },
  { level: 7,  minScore: 20000,   label: 'Master',      emoji: '💫', color: '#a855f7', gradient: 'from-violet-400 to-purple-600',              glowColor: 'rgba(168,85,247,0.6)',   discount: 10, animationIntensity: 2, nameColor: '#a855f7' },
  { level: 8,  minScore: 50000,   label: 'GrandMaster', emoji: '💎', color: '#f59e0b', gradient: 'from-amber-400 to-yellow-500',               glowColor: 'rgba(245,158,11,0.65)',  discount: 13, animationIntensity: 3, nameColor: '#f59e0b' },
  { level: 9,  minScore: 250000,  label: 'Titan',       emoji: '🌟', color: '#eab308', gradient: 'from-yellow-400 to-amber-500',               glowColor: 'rgba(234,179,8,0.75)',   discount: 17, animationIntensity: 3, nameColor: '#eab308' },
  { level: 10, minScore: 1250000, label: 'Mythic',      emoji: '👑', color: '#f59e0b', gradient: 'from-amber-400 to-orange-400',               glowColor: 'rgba(245,158,11,0.8)',   discount: 20, animationIntensity: 3, nameColor: '#f59e0b' },
  { level: 11, minScore: 6250000, label: 'Supreme',     emoji: '🏆', color: '#10b981', gradient: 'from-emerald-400 via-cyan-400 to-violet-500', glowColor: 'rgba(16,185,129,0.9)',  discount: 20, animationIntensity: 4, nameColor: '#10b981' },
];

export const MAX_LEVEL = 11;
export const LEVEL_THRESHOLDS = LEVEL_INFO.map(l => l.minScore);

// ── Per-tier limit structure ─────────────────────────────────────────────────
export interface LevelTierLimits {
  free: number;
  basic: number;
  ultra: number;
}

// Special sentinel value meaning "unlimited" in the level table
export const UNLIMITED = 9999;

// ── Unified daily limits per level ───────────────────────────────────────────
// notes     = Chunk Notes Reading free sessions/day
// tts       = Audio/TTS free sessions/day
// concept   = Concept (DEEP_DIVE) tab free opens/day — Free=0, Basic/Ultra scaled with write
// retention = Retention (PREMIUM) tab free opens/day — Free=0 (N/A), Basic/Ultra scaled with write
export interface LevelDailyLimits {
  mcq:               LevelTierLimits;
  dl:                LevelTierLimits;
  pdf:               LevelTierLimits;
  video:             LevelTierLimits;
  notes:             LevelTierLimits;
  tts:               LevelTierLimits;
  write:             LevelTierLimits;
  concept:           LevelTierLimits;
  retention:         LevelTierLimits;
  flashcard:         LevelTierLimits;
  creditWriteMax:    number;
  bonusLoginCredits: number;
}

// ── Helper to build one level row ────────────────────────────────────────────
// MCQ:       base Free=50, Basic=70, Ultra=100; +30 per level (all tiers)
// DL:        base Free=2,  Basic=5,  Ultra=10;  Free+2, Basic+3, Ultra+5 per level
// PDF:       base Free=2,  Basic=3,  Ultra=5;   Free+2, Basic+3, Ultra+5 per level
// Video:     base Free=0,  Basic=2,  Ultra=5;   Free+1(from L2), Basic+2, Ultra+2 per level
// Notes:     base Free=10, Basic=10, Ultra=10;  Free+2, Basic+4, Ultra+6 per level; L9+ = UNLIMITED
// TTS:       Same as Notes
// Write:     base Free=0,  Basic=5,  Ultra=10;  Basic+1, Ultra+1 per level from L4
// Concept:   base Free=5,  Basic=5,  Ultra=5;   Free+2, Basic+4, Ultra+6 per level (Free also open now)
// Retention: Same formula as Write (Free=0 N/A, Basic/Ultra scaled — Premium only)
// Flashcard: base Free=10, Basic=15, Ultra=20;  +10 per level (all tiers)
// bonusLoginCredits: 0,5,10,15,20,30,40,50,65,80,100

const _BONUS_LOGIN = [0, 5, 10, 15, 20, 30, 40, 50, 65, 80, 100];
const _CREDIT_WRITE_MAX = [100, 100, 100, 100, 100, 110, 120, 130, 140, 145, 150];

const buildTable = (): Record<number, LevelDailyLimits> => {
  const tbl: Record<number, LevelDailyLimits> = {};
  for (let i = 1; i <= MAX_LEVEL; i++) {
    const n = i - 1; // 0-indexed increment
    const unlimitedNotes = i >= 9;
    const writeBasic = Math.max(5, 5 + Math.max(0, n - 3));
    const writeUltra = Math.max(10, 10 + Math.max(0, n - 3));
    tbl[i] = {
      mcq:       { free: 50  + n * 30, basic: 70  + n * 30, ultra: 100 + n * 30 },
      dl:        { free: 2   + n * 2,  basic: 5   + n * 3,  ultra: 10  + n * 5  },
      pdf:       { free: 2   + n * 2,  basic: 3   + n * 3,  ultra: 5   + n * 5  },
      video:     { free: Math.max(0, n), basic: 2 + n * 2, ultra: 5 + n * 2 },
      notes:     unlimitedNotes ? { free: UNLIMITED, basic: UNLIMITED, ultra: UNLIMITED } : { free: 10 + n * 2, basic: 10 + n * 4, ultra: 10 + n * 6 },
      tts:       unlimitedNotes ? { free: UNLIMITED, basic: UNLIMITED, ultra: UNLIMITED } : { free: 10 + n * 2, basic: 10 + n * 4, ultra: 10 + n * 6 },
      write:     { free: 0, basic: writeBasic, ultra: writeUltra },
      concept:   { free: 5 + n * 2, basic: 5 + n * 4, ultra: 5 + n * 6 },
      retention: { free: 0, basic: writeBasic, ultra: writeUltra },
      flashcard: { free: 10 + n * 10, basic: 15 + n * 10, ultra: 20 + n * 10 },
      creditWriteMax:    _CREDIT_WRITE_MAX[n],
      bonusLoginCredits: _BONUS_LOGIN[n],
    };
  }
  return tbl;
};

export const LEVEL_DAILY_LIMITS_TABLE = buildTable();

// ── Get base limits (without admin override) ─────────────────────────────────
export const getLevelDailyLimits = (level: number): LevelDailyLimits => {
  const lvl = Math.min(MAX_LEVEL, Math.max(1, level));
  return LEVEL_DAILY_LIMITS_TABLE[lvl] ?? LEVEL_DAILY_LIMITS_TABLE[1];
};

// ── Get limits with optional admin override ───────────────────────────────────
// Admin can override per-level per-tier limits via settings.levelLimitsOverride
export const getLevelDailyLimitsWithOverride = (
  level: number,
  settings?: { levelLimitsOverride?: Record<string, Partial<LevelDailyLimitsOverride>> } | null
): LevelDailyLimits => {
  const base = getLevelDailyLimits(level);
  if (!settings?.levelLimitsOverride) return base;
  const ov = settings.levelLimitsOverride[String(level)];
  if (!ov) return base;

  const mergeTier = (b: LevelTierLimits, o?: Partial<LevelTierLimits>): LevelTierLimits =>
    o ? { free: o.free ?? b.free, basic: o.basic ?? b.basic, ultra: o.ultra ?? b.ultra } : b;

  return {
    mcq:               mergeTier(base.mcq,       ov.mcq),
    dl:                mergeTier(base.dl,         ov.dl),
    pdf:               mergeTier(base.pdf,        ov.pdf),
    video:             mergeTier(base.video,      ov.video),
    notes:             mergeTier(base.notes,      ov.notes),
    tts:               mergeTier(base.tts,        ov.tts),
    write:             mergeTier(base.write,      ov.write),
    concept:           mergeTier(base.concept,    ov.concept),
    retention:         mergeTier(base.retention,  ov.retention),
    flashcard:         mergeTier(base.flashcard,  ov.flashcard),
    creditWriteMax:    ov.creditWriteMax    ?? base.creditWriteMax,
    bonusLoginCredits: ov.bonusLoginCredits ?? base.bonusLoginCredits,
  };
};

// Type for admin override (all optional)
export interface LevelDailyLimitsOverride {
  mcq?:               Partial<LevelTierLimits>;
  dl?:                Partial<LevelTierLimits>;
  pdf?:               Partial<LevelTierLimits>;
  video?:             Partial<LevelTierLimits>;
  notes?:             Partial<LevelTierLimits>;
  tts?:               Partial<LevelTierLimits>;
  write?:             Partial<LevelTierLimits>;
  concept?:           Partial<LevelTierLimits>;
  retention?:         Partial<LevelTierLimits>;
  flashcard?:         Partial<LevelTierLimits>;
  creditWriteMax?:    number;
  bonusLoginCredits?: number;
}

// ── Unified effective daily limit getter ─────────────────────────────────────
export type DailyLimitFeature = 'mcq' | 'video' | 'pdf' | 'dl' | 'write' | 'notes' | 'tts' | 'concept' | 'retention' | 'flashcard';

export const getEffectiveDailyLimit = (
  feature: DailyLimitFeature,
  level: number,
  tier: 'FREE' | 'BASIC' | 'ULTRA',
  settings?: { mcqLimitFree?: number; mcqLimitBasic?: number; mcqLimitUltra?: number; levelLimitsOverride?: Record<string, Partial<LevelDailyLimitsOverride>> } | null
): number => {
  const ld = getLevelDailyLimitsWithOverride(level, settings);
  const tierKey: keyof LevelTierLimits = tier === 'FREE' ? 'free' : tier === 'BASIC' ? 'basic' : 'ultra';
  const levelValue = ld[feature][tierKey];

  // MCQ: admin's flat override (mcqLimitFree/Basic/Ultra) treated as L1 base → scale with level
  if (feature === 'mcq' && settings && !settings.levelLimitsOverride?.[String(level)]?.mcq) {
    const l1 = LEVEL_DAILY_LIMITS_TABLE[1].mcq[tierKey];
    const adminBase =
      tier === 'FREE'  ? (settings.mcqLimitFree  ?? 0) :
      tier === 'BASIC' ? (settings.mcqLimitBasic ?? 0) :
                         (settings.mcqLimitUltra ?? 0);
    if (adminBase > 0) {
      return adminBase + (levelValue - l1);
    }
  }
  return levelValue;
};

// ── Backward-compat: LevelLimitBonus (derived from new table) ────────────────
export interface LevelLimitBonus {
  mcqBonus:          number;
  writeFreeBonus:    number;
  dlBonus:           number;
  videoFreeBonus:    number;
  pdfFreeBonus:      number;
  creditWriteMax:    number;
  bonusLoginCredits: number;
}

export const getLevelLimitBonus = (level: number): LevelLimitBonus => {
  const cur = getLevelDailyLimits(level);
  const l1  = getLevelDailyLimits(1);
  return {
    mcqBonus:          cur.mcq.free   - l1.mcq.free,
    writeFreeBonus:    cur.write.basic - l1.write.basic,
    dlBonus:           cur.dl.free    - l1.dl.free,
    videoFreeBonus:    cur.video.basic - l1.video.basic,
    pdfFreeBonus:      cur.pdf.basic  - l1.pdf.basic,
    creditWriteMax:    cur.creditWriteMax,
    bonusLoginCredits: cur.bonusLoginCredits,
  };
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

export const getLevelTopBarEffects = (lvl: LevelInfo): Array<{id:string;enabled:boolean;color:string;speed?:number;opacity?:number}> => {
  const c = lvl.color;
  const g = lvl.glowColor;
  switch (lvl.animationIntensity) {
    case 0: return [];
    case 1:
      return [{ id: 'shimmer-forward', enabled: true, color: c, speed: 3, opacity: 0.3 }];
    case 2:
      return [
        { id: 'shimmer-forward', enabled: true, color: c, speed: 2, opacity: 0.5 },
        { id: 'glow-bottom',     enabled: true, color: g, speed: 1.5, opacity: 0.6 },
      ];
    case 3:
      return [
        { id: 'shimmer-forward', enabled: true, color: c, speed: 1.5 },
        { id: 'shimmer-reverse', enabled: true, color: c, speed: 2 },
        { id: 'glow-both',       enabled: true, color: g, speed: 1 },
        { id: 'sparkle-top',     enabled: true, color: c, speed: 1 },
      ];
    case 4:
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
