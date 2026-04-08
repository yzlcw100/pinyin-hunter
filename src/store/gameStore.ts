import { create } from 'zustand';
import type { PinyinSyllable } from '../data/pinyinData';
import { LEVEL_CONFIGS, getByDifficulty } from '../data/pinyinData';
import type { LevelConfig } from '../data/pinyinData';
import {
  saveProgress,
  loadProgress,
  setStoredHighScore,
  getStoredHighScore,
  updateLevelRecord,
} from '../utils/storageUtils';
import type { GameLevel, LevelRecord } from '../utils/storageUtils';

// ============================================================
// 类型定义
// ============================================================

export type GamePhase = 'home' | 'playing' | 'result';

export interface GameQuestion {
  syllable: PinyinSyllable;
  options: string[];
  correctIndex: number;
  displayPinyin: string;
}

export interface GameState {
  // 状态
  gamePhase: GamePhase;
  level: GameLevel;
  currentQuestion: GameQuestion | null;
  score: number;
  combo: number;
  prevCombo: number;
  maxCombo: number;
  lives: number;
  questionIndex: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  usedQuestionIds: Set<string>;
  highScore: number;

  // Phase 3: 进度系统
  levelRecords: Record<GameLevel, LevelRecord | null>;
  unlockedLevels: Set<GameLevel>;

  // Phase 3: 本局数据（用于结果页）
  gameStartTime: number | null;

  // actions
  setLevel: (level: GameLevel) => void;
  startGame: () => void;
  nextQuestion: () => void;
  checkAnswer: (selectedIndex: number) => boolean;
  resetGame: () => void;
  goHome: () => void;
  goResult: () => void;
  replayLevel: () => void;
  goToNextLevel: () => void;

  // 内部
  _saveProgress: () => void;
  _loadProgress: () => void;
}

// ============================================================
// 常量
// ============================================================

const QUESTIONS_PER_GAME = 10;
const INITIAL_LIVES = 3;
const SCORE_CORRECT = 10;
const SCORE_COMBO_2 = 2;
const SCORE_COMBO_3 = 5;
const SCORE_COMBO_5 = 10;
const SCORE_WRONG = -5;
const PASS_THRESHOLD = 6; // 通关：答对≥6题

// ============================================================
// 内部工具
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 生成题目
 * L1/L2: 仅本级难度 + 少量跨级干扰
 * L3/L4: 混入 L1/L2 干扰项（20%概率）
 */
function generateQuestion(
  level: GameLevel,
  usedIds: Set<string>,
  levelConfig: LevelConfig
): GameQuestion {
  const pool = getByDifficulty(level as 1 | 2 | 3 | 4);
  const available = pool.filter((s) => !usedIds.has(s.id));
  const source = available.length > 0 ? available : pool;

  const syllable = source[Math.floor(Math.random() * source.length)];

  // 干扰项来源
  let distractorPool: PinyinSyllable[] = [];
  if (levelConfig.hasCrossLevelDistractors && Math.random() < 0.3) {
    // 混入1个低级别干扰项
    const lowerLevels = ([1, 2] as GameLevel[]).filter((l) => l < level);
    const lowerLevel = lowerLevels[Math.floor(Math.random() * lowerLevels.length)];
    const lowerPool = getByDifficulty(lowerLevel as 1 | 2 | 3 | 4);
    distractorPool = shuffleArray(lowerPool).slice(0, 1);
  }

  const sameLevelDistractors = shuffleArray(
    source.filter((s) => s.id !== syllable.id)
  ).slice(0, levelConfig.optionCount - 1 - distractorPool.length);

  const allOptions = shuffleArray([syllable, ...distractorPool, ...sameLevelDistractors]);
  const correctIndex = allOptions.findIndex((s) => s.id === syllable.id);

  return {
    syllable,
    options: allOptions.slice(0, levelConfig.optionCount).map((s) => s.characters[0]),
    correctIndex,
    displayPinyin: syllable.marked,  // 带声调的拼音
  };
}

/**
 * 计算星级
 */
export function calculateStars(correctCount: number, total: number): number {
  if (correctCount === total) return 3;
  if (correctCount >= 8) return 2;
  if (correctCount >= PASS_THRESHOLD) return 1;
  return 0;
}

/**
 * 检查关卡是否通过
 */
export function isLevelPassed(correctCount: number): boolean {
  return correctCount >= PASS_THRESHOLD;
}

// ============================================================
// Store
// ============================================================

function buildInitialState() {
  const savedHighScore = getStoredHighScore();
  const savedProgress = loadProgress();
  return {
    gamePhase: 'home' as GamePhase,
    level: savedProgress.lastPlayedLevel || 1,
    currentQuestion: null,
    score: 0,
    combo: 0,
    prevCombo: 0,
    maxCombo: 0,
    lives: INITIAL_LIVES,
    questionIndex: 0,
    totalQuestions: QUESTIONS_PER_GAME,
    correctCount: 0,
    wrongCount: 0,
    usedQuestionIds: new Set<string>(),
    highScore: savedHighScore,
    levelRecords: savedProgress.levelRecords || { 1: null, 2: null, 3: null, 4: null },
    unlockedLevels: new Set<GameLevel>([1, 2, 3, 4] as GameLevel[]),
    gameStartTime: null,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...buildInitialState(),

  // ─── Actions ───────────────────────────────────────────────

  setLevel: (level) => {
    set({ level });
    const { levelRecords } = get();
    // 检查是否解锁
    if (level === 1 || (levelRecords[(level - 1) as GameLevel] !== null && levelRecords[(level - 1) as GameLevel]!.stars > 0)) {
      get()._saveProgress();
    }
  },

  startGame: () => {
    const { level } = get();
    const levelConfig = LEVEL_CONFIGS.find((c) => c.level === level)!;
    const question = generateQuestion(level, new Set(), levelConfig);
    set({
      gamePhase: 'playing',
      currentQuestion: question,
      score: 0,
      combo: 0,
      prevCombo: 0,
      maxCombo: 0,
      lives: INITIAL_LIVES,
      questionIndex: 1,
      totalQuestions: QUESTIONS_PER_GAME,
      correctCount: 0,
      wrongCount: 0,
      usedQuestionIds: new Set([question.syllable.id]),
      gameStartTime: Date.now(),
    });
  },

  nextQuestion: () => {
    const { level, usedQuestionIds, questionIndex, totalQuestions } = get();
    const levelConfig = LEVEL_CONFIGS.find((c) => c.level === level)!;

    if (questionIndex >= totalQuestions) {
      get().goResult();
      return;
    }

    const question = generateQuestion(level, usedQuestionIds, levelConfig);
    const newUsed = new Set(usedQuestionIds);
    newUsed.add(question.syllable.id);

    set({
      currentQuestion: question,
      questionIndex: questionIndex + 1,
      usedQuestionIds: newUsed,
    });
  },

  checkAnswer: (selectedIndex: number) => {
    const { currentQuestion, score, combo, maxCombo, lives, correctCount, wrongCount, highScore } =
      get();
    if (!currentQuestion) return false;

    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    let newScore = score;
    let newCombo = combo;
    let newMaxCombo = maxCombo;
    let newLives = lives;
    let newCorrectCount = correctCount;
    let newWrongCount = wrongCount;

    if (isCorrect) {
      newCombo += 1;
      newCorrectCount += 1;
      newMaxCombo = Math.max(newMaxCombo, newCombo);

      newScore += SCORE_CORRECT;
      if (newCombo >= 5) newScore += SCORE_COMBO_5;
      else if (newCombo >= 3) newScore += SCORE_COMBO_3;
      else if (newCombo >= 2) newScore += SCORE_COMBO_2;
    } else {
      newCombo = 0;
      newWrongCount += 1;
      newLives -= 1;
      newScore = Math.max(0, newScore + SCORE_WRONG);
    }

    const finalHighScore = Math.max(highScore, newScore);
    if (finalHighScore > highScore) {
      setStoredHighScore(finalHighScore);
    }

    set({
      score: newScore,
      combo: newCombo,
      prevCombo: combo,
      maxCombo: newMaxCombo,
      lives: newLives,
      correctCount: newCorrectCount,
      wrongCount: newWrongCount,
      highScore: finalHighScore,
    });

    return isCorrect;
  },

  resetGame: () => {
    set({
      gamePhase: 'home',
      currentQuestion: null,
      score: 0,
      combo: 0,
      prevCombo: 0,
      maxCombo: 0,
      lives: INITIAL_LIVES,
      questionIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      usedQuestionIds: new Set(),
      gameStartTime: null,
    });
  },

  goHome: () => {
    get()._loadProgress(); // 重新加载最新进度
    set({ gamePhase: 'home' });
  },

  goResult: () => {
    const { score, highScore, correctCount, totalQuestions, level } = get();
    const finalHighScore = Math.max(highScore, score);
    if (finalHighScore > highScore) {
      setStoredHighScore(finalHighScore);
    }

    // 计算星级
    const stars = calculateStars(correctCount, totalQuestions);
    const passed = isLevelPassed(correctCount);

    // 更新关卡记录
    updateLevelRecord(level, stars, score, correctCount);

    // 如果通关且不是最后一关，解锁下一关
    let newUnlockedLevels = new Set(get().unlockedLevels);
    if (passed && level < 4) {
      newUnlockedLevels.add((level + 1) as GameLevel);
    }

    // 重新加载最新进度
    const updatedProgress = loadProgress();

    set({
      gamePhase: 'result',
      highScore: finalHighScore,
      levelRecords: updatedProgress.levelRecords,
      unlockedLevels: newUnlockedLevels,
      gameStartTime: null,
    });

    get()._saveProgress();
  },

  replayLevel: () => {
    const { level } = get();
    get().resetGame();
    set({ level });
    get().startGame();
  },

  goToNextLevel: () => {
    const { level } = get();
    const nextLevel = Math.min(level + 1, 4) as GameLevel;
    get().resetGame();
    set({ level: nextLevel });
    get().startGame();
  },

  _saveProgress: () => {
    const { level, levelRecords } = get();
    saveProgress({
      currentLevel: level,
      lastPlayedLevel: level,
      levelRecords,
    });
  },

  _loadProgress: () => {
    const saved = loadProgress();
    // 所有关卡解锁（学习游戏，不需要通关前置关卡也能玩）
    const newUnlockedLevels = new Set<GameLevel>([1, 2, 3, 4] as GameLevel[]);
    set({
      level: saved.lastPlayedLevel || 1,
      levelRecords: saved.levelRecords || { 1: null, 2: null, 3: null, 4: null },
      unlockedLevels: newUnlockedLevels,
      highScore: saved.highScore || getStoredHighScore(),
    });
  },
}));
