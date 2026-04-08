// ============================================================
// localStorage 工具 - Phase 3
// ============================================================

const PREFIX = 'pinyin_';

export type GameLevel = 1 | 2 | 3 | 4;

// 进度数据
export interface ProgressData {
  currentLevel: GameLevel;
  lastPlayedLevel: GameLevel;
  highScore: number;
  totalPlayed: number;
  totalCorrect: number;
  totalAnswered: number;
  // 每关通关信息
  levelRecords: Record<GameLevel, LevelRecord | null>;
}

export interface LevelRecord {
  stars: number;       // 0-3星
  bestScore: number;   // 本关最高分
  bestCorrect: number; // 本关最高正确数
  completed: boolean;   // 是否通关（答对≥6题）
}

// ─── 进度读写 ────────────────────────────────────────────────

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(PREFIX + 'progress');
    if (!raw) return DEFAULT_PROGRESS();
    return { ...DEFAULT_PROGRESS(), ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROGRESS();
  }
}

export function saveProgress(data: Partial<ProgressData>): void {
  try {
    const current = loadProgress();
    const next = { ...current, ...data };
    localStorage.setItem(PREFIX + 'progress', JSON.stringify(next));
  } catch {
    // localStorage 不可用，静默失败
  }
}

function DEFAULT_PROGRESS(): ProgressData {
  return {
    currentLevel: 1,
    lastPlayedLevel: 1,
    highScore: 0,
    totalPlayed: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    levelRecords: {
      1: null,
      2: null,
      3: null,
      4: null,
    },
  };
}

// ─── 关卡解锁判断 ────────────────────────────────────────────

/**
 * 检查某关卡是否已解锁
 * 解锁条件：前置关卡（Ln-1）有通关记录（stars > 0）
 */
export function isLevelUnlocked(level: GameLevel, levelRecords: Record<GameLevel, LevelRecord | null>): boolean {
  if (level === 1) return true; // L1 始终解锁
  const prevRecord = levelRecords[(level - 1) as GameLevel];
  return prevRecord !== null && prevRecord.stars > 0;
}

/**
 * 获取某关卡的解锁状态
 */
export function getLevelUnlockStatus(level: GameLevel): boolean {
  const progress = loadProgress();
  return isLevelUnlocked(level, progress.levelRecords);
}

/**
 * 获取总体进度（已通关关卡数）
 */
export function getCompletedLevelCount(levelRecords: Record<GameLevel, LevelRecord | null>): number {
  return ([1, 2, 3, 4] as GameLevel[]).filter(
    (lvl) => levelRecords[lvl] !== null && levelRecords[lvl].stars > 0
  ).length;
}

/**
 * 获取下一个未通关的关卡（用于"继续游戏"入口）
 */
export function getNextUnfinishedLevel(levelRecords: Record<GameLevel, LevelRecord | null>): GameLevel {
  // 优先返回 lastPlayedLevel（如果有记录）
  const progress = loadProgress();
  const last = progress.lastPlayedLevel;
  if (levelRecords[last] === null || levelRecords[last].stars === 0) {
    return last;
  }
  // 否则找下一个未完成的关卡
  for (const lvl of [1, 2, 3, 4] as GameLevel[]) {
    if (levelRecords[lvl] === null || levelRecords[lvl].stars === 0) {
      return lvl;
    }
  }
  return 4; // 全部通关，返回最后一关
}

// ─── 关卡记录更新 ─────────────────────────────────────────────

/**
 * 更新单关记录（仅在获得更高星级时更新）
 */
export function updateLevelRecord(
  level: GameLevel,
  stars: number,
  score: number,
  correctCount: number
): void {
  const progress = loadProgress();
  const existing = progress.levelRecords[level];

  // 只有得分提升或首次通关才更新
  const shouldUpdate =
    existing === null ||
    stars > existing.stars ||
    score > existing.bestScore;

  if (shouldUpdate) {
    progress.levelRecords[level] = {
      stars: Math.max(stars, existing?.stars ?? 0),
      bestScore: Math.max(score, existing?.bestScore ?? 0),
      bestCorrect: Math.max(correctCount, existing?.bestCorrect ?? 0),
      completed: correctCount >= 6,
    };
    saveProgress({ levelRecords: progress.levelRecords });
  }
}

// ─── 单值存取 ────────────────────────────────────────────────

export function getHighScore(): number {
  return loadProgress().highScore;
}

export function setHighScore(score: number): void {
  saveProgress({ highScore: score });
}

// ─── 游戏记录更新 ─────────────────────────────────────────────

export function recordGameResult(correct: number, total: number): void {
  const progress = loadProgress();
  saveProgress({
    totalPlayed: progress.totalPlayed + 1,
    totalCorrect: progress.totalCorrect + correct,
    totalAnswered: progress.totalAnswered + total,
  });
}

// ─── 最高分（独立键） ─────────────────────────────────────────

export function getStoredHighScore(): number {
  try {
    return parseInt(localStorage.getItem(PREFIX + 'highscore') ?? '0', 10);
  } catch {
    return 0;
  }
}

export function setStoredHighScore(score: number): void {
  try {
    const current = getStoredHighScore();
    if (score > current) {
      localStorage.setItem(PREFIX + 'highscore', String(score));
      saveProgress({ highScore: score });
    }
  } catch {}
}

// ─── 清空数据 ────────────────────────────────────────────────

export function clearAllData(): void {
  try {
    localStorage.removeItem(PREFIX + 'progress');
    localStorage.removeItem(PREFIX + 'highscore');
    localStorage.removeItem(PREFIX + 'audio_muted');
  } catch {}
}
