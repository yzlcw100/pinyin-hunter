import type { Difficulty } from '../data/pinyinData';

// ============================================================
// 难度计算
// ============================================================

/**
 * 根据拼音计算难度（运行时用，主要用于显示）
 * L1: 单韵母
 * L2: 复合韵母
 * L3: 整体认读
 * L4: 鼻韵母
 */
export function calculateDifficulty(pinyin: string): Difficulty {
  const compoundFinals = ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe'];
  const nasalFinals = ['an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'];
  const simpleFinals = ['a', 'o', 'e', 'i', 'u', 'ü', 'er'];

  // 整体认读
  const integrated = ['zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu', 'yu', 'ye', 'yue', 'yuan', 'yin', 'yun', 'ying'];
  if (integrated.includes(pinyin)) return 'L3';

  // 匹配最长韵母
  const allFinals = [...compoundFinals, ...nasalFinals, ...simpleFinals];
  let matched = '';
  for (const f of allFinals) {
    if (pinyin.endsWith(f) && f.length > matched.length) {
      matched = f;
    }
  }

  if (simpleFinals.includes(matched)) return 'L1';
  if (compoundFinals.includes(matched)) return 'L2';
  if (nasalFinals.includes(matched)) return 'L4';
  return 'L2';
}

// ============================================================
// 声调标注（简化版：数字声调）
// ============================================================

/**
 * 为拼音标注声调（返回带数字的拼音）
 */
export function toneMark(pinyin: string, tone: 1 | 2 | 3 | 4 = 1): string {
  return `${pinyin}${tone}`;
}

// ============================================================
// 音频路径（预留）
// ============================================================

export function getAudioPath(pinyin: string): string {
  return `/audio/pinyin/${pinyin}.mp3`;
}

// ============================================================
// 难度标签
// ============================================================

export function getDifficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    L1: '🌱 基础',
    L2: '🌿进阶',
    L3: '🌳挑战',
    L4: '🏆大师',
  };
  return labels[difficulty];
}

export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    L1: 'text-green-600',
    L2: 'text-yellow-600',
    L3: 'text-red-600',
    L4: 'text-purple-600',
  };
  return colors[difficulty];
}

// ============================================================
// 星级评定
// ============================================================

export function getStars(correctCount: number, totalQuestions: number): number {
  if (correctCount === totalQuestions) return 3;
  if (correctCount >= 8) return 2;
  if (correctCount >= 6) return 1;
  return 0;
}
