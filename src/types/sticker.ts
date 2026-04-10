// Use string literals instead of enum for erasableSyntaxOnly compatibility
export const Rarity = {
  Common: 'common',
  Rare: 'rare',
  Epic: 'epic',
  Legendary: 'legendary',
} as const;

export type Rarity = (typeof Rarity)[keyof typeof Rarity];

export const StickerCategory = {
  Animal: 'animal',
  Pinyin: 'pinyin',
  Achievement: 'achievement',
} as const;

export type StickerCategory = (typeof StickerCategory)[keyof typeof StickerCategory];

export interface Sticker {
  id: string;
  name: string;
  image: string;
  rarity: Rarity;
  category: StickerCategory;
  description: string;
  unlockHint: string;
}

export interface StickerCollection {
  unlockedIds: string[];
  unlockedAt: Record<string, number>;
  totalPulls: number;
  lastPullAt: number;
}

export type StickerEvent = 'level_complete' | 'perfect_score' | 'first_play' | 'combo_10';
