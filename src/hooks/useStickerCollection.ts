import { useCallback, useMemo, useState } from 'react';
import { ALL_STICKERS, RARITY_WEIGHTS } from '../data/stickers';
import type { Sticker, StickerCollection, StickerEvent } from '../types/sticker';
import { Rarity } from '../types/sticker';

const STORAGE_KEY = 'pinyin_sticker_collection';
const PITY_THRESHOLD = 50;

function loadCollection(): StickerCollection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    unlockedIds: [],
    unlockedAt: {},
    totalPulls: 0,
    lastPullAt: 0,
  };
}

function saveCollection(col: StickerCollection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(col));
  } catch {}
}

function weightedRandomRarity(totalPulls: number): Rarity {
  // 保底：每 PITY_THRESHOLD 抽必出 Epic+
  if (totalPulls > 0 && totalPulls % PITY_THRESHOLD === 0) {
    const roll = Math.random() * 100;
    if (roll < 50) return Rarity.Epic;
    return Rarity.Legendary;
  }

  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) return rarity as Rarity;
  }
  return Rarity.Common;
}

function drawSticker(rarity: Rarity, unlockedIds: string[]): Sticker {
  const pool = ALL_STICKERS.filter(
    (s) => s.rarity === rarity && !unlockedIds.includes(s.id)
  );

  // 如果该稀有度没有未解锁的，向下兼容
  if (pool.length === 0) {
    for (const r of [Rarity.Common, Rarity.Rare, Rarity.Epic, Rarity.Legendary]) {
      const fallback = ALL_STICKERS.filter(
        (s) => s.rarity === r && !unlockedIds.includes(s.id)
      );
      if (fallback.length > 0) {
        return fallback[Math.floor(Math.random() * fallback.length)];
      }
    }
    return ALL_STICKERS[Math.floor(Math.random() * ALL_STICKERS.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export interface StickerProgress {
  total: number;
  unlocked: number;
  common: { total: number; unlocked: number };
  rare: { total: number; unlocked: number };
  epic: { total: number; unlocked: number };
  legendary: { total: number; unlocked: number };
}

export function useStickerCollection() {
  const [collection, setCollection] = useState<StickerCollection>(loadCollection);

  const grantSticker = useCallback(
    (_event: StickerEvent): { sticker: Sticker; isNew: boolean } => {
      let result: { sticker: Sticker; isNew: boolean } | null = null;

      setCollection((prev) => {
        const totalPulls = prev.totalPulls + 1;
        const rarity = weightedRandomRarity(totalPulls);
        const sticker = drawSticker(rarity, prev.unlockedIds);

        const isNew = !prev.unlockedIds.includes(sticker.id);
        const unlockedIds = isNew ? [...prev.unlockedIds, sticker.id] : prev.unlockedIds;
        const unlockedAt = isNew
          ? { ...prev.unlockedAt, [sticker.id]: Date.now() }
          : prev.unlockedAt;

        const next: StickerCollection = {
          unlockedIds,
          unlockedAt,
          totalPulls,
          lastPullAt: Date.now(),
        };

        result = { sticker, isNew };
        saveCollection(next);
        return next;
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return result!;
    },
    []
  );

  const isUnlocked = useCallback(
    (id: string) => collection.unlockedIds.includes(id),
    [collection.unlockedIds]
  );

  const progress = useMemo<StickerProgress>(() => {
    const byRarity = (r: Rarity) => ({
      total: ALL_STICKERS.filter((s) => s.rarity === r).length,
      unlocked: collection.unlockedIds.filter(
        (id) => ALL_STICKERS.find((s) => s.id === id)?.rarity === r
      ).length,
    });

    return {
      total: ALL_STICKERS.length,
      unlocked: collection.unlockedIds.length,
      common: byRarity(Rarity.Common),
      rare: byRarity(Rarity.Rare),
      epic: byRarity(Rarity.Epic),
      legendary: byRarity(Rarity.Legendary),
    };
  }, [collection]);

  return { collection, grantSticker, isUnlocked, progress };
}
