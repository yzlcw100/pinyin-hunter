import type { Sticker } from '../types/sticker';
import { Rarity } from '../types/sticker';

interface StickerCardProps {
  sticker: Sticker;
  isUnlocked: boolean;
  isNew?: boolean;
  onClick?: () => void;
}

const RARITY_BORDER: Record<Rarity, string> = {
  [Rarity.Common]: 'border-white/20',
  [Rarity.Rare]: 'border-blue-400/60 shadow-blue-400/30',
  [Rarity.Epic]: 'border-purple-500/70 shadow-purple-500/40',
  [Rarity.Legendary]: 'border-yellow-400 shadow-yellow-400/50',
};

const RARITY_GLOW: Record<Rarity, string> = {
  [Rarity.Common]: '',
  [Rarity.Rare]: 'shadow-[0_0_12px_rgba(96,165,250,0.4)]',
  [Rarity.Epic]: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]',
  [Rarity.Legendary]: 'shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-legendary-glow',
};

export function StickerCard({ sticker, isUnlocked, isNew = false, onClick }: StickerCardProps) {
  const borderClass = isUnlocked ? RARITY_BORDER[sticker.rarity] : 'border-white/10';
  const glowClass = isUnlocked ? RARITY_GLOW[sticker.rarity] : '';

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1
        transition-all duration-200 select-none
        ${borderClass} ${glowClass}
        ${isUnlocked
          ? isNew
            ? 'bg-white/15 animate-sticker-pop cursor-pointer hover:scale-105 active:scale-95'
            : 'bg-white/10 cursor-pointer hover:bg-white/15 active:scale-95'
          : 'bg-white/5 cursor-default grayscale'
        }
      `}
    >
      {/* 贴纸 emoji */}
      <span
        className={`text-4xl sm:text-5xl transition-all duration-300 ${!isUnlocked ? 'scale-75 opacity-30' : ''}`}
      >
        {sticker.image}
      </span>

      {/* 名称 */}
      <span
        className={`text-xs font-medium px-1 text-center leading-tight ${isUnlocked ? 'text-white/80' : 'text-white/30'}`}
      >
        {sticker.name}
      </span>

      {/* 未解锁锁图标 */}
      {!isUnlocked && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
          <span className="text-2xl opacity-50">🔒</span>
        </span>
      )}

      {/* 新标签 */}
      {isNew && isUnlocked && (
        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-sticker-pop">
          NEW
        </span>
      )}
    </button>
  );
}
