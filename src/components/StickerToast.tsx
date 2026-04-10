import { useEffect, useState } from 'react';
import type { Sticker } from '../types/sticker';
import { Rarity } from '../types/sticker';

interface StickerToastProps {
  sticker: Sticker;
  isNew: boolean;
  onClose: () => void;
}

const RARITY_ACCENT: Record<Rarity, { bg: string; border: string; text: string; glow: string }> = {
  [Rarity.Common]: {
    bg: 'bg-white/90',
    border: 'border-white/30',
    text: 'text-gray-800',
    glow: '',
  },
  [Rarity.Rare]: {
    bg: 'bg-blue-500/90',
    border: 'border-blue-300/50',
    text: 'text-white',
    glow: 'shadow-[0_0_24px_rgba(96,165,250,0.6)]',
  },
  [Rarity.Epic]: {
    bg: 'bg-purple-600/90',
    border: 'border-purple-300/50',
    text: 'text-white',
    glow: 'shadow-[0_0_32px_rgba(168,85,247,0.7)]',
  },
  [Rarity.Legendary]: {
    bg: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500',
    border: 'border-yellow-300',
    text: 'text-white',
    glow: 'shadow-[0_0_40px_rgba(250,204,21,0.8)] animate-legendary-glow',
  },
};

const RARITY_LABEL: Record<Rarity, string> = {
  [Rarity.Common]: '普通',
  [Rarity.Rare]: '稀有',
  [Rarity.Epic]: '史诗',
  [Rarity.Legendary]: '传说',
};

export function StickerToast({ sticker, isNew, onClose }: StickerToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 触发动画
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const style = RARITY_ACCENT[sticker.rarity];

  return (
    <div
      className={`
        fixed top-0 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-sm
        transition-all duration-300 ease-out
        ${visible ? 'top-6 opacity-100 translate-y-0' : '-top-24 opacity-0 -translate-y-4'}
      `}
    >
      <div
        className={`
          rounded-2xl border-2 p-4 flex items-center gap-4
          ${style.bg} ${style.border} ${style.glow}
        `}
      >
        {/* 贴纸大图 */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-5xl shadow-lg">
          {sticker.image}
        </div>

        {/* 文字信息 */}
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold uppercase tracking-wider ${RARITY_LABEL[sticker.rarity] === '传说' ? 'text-yellow-100' : style.text}`}>
            {isNew ? '获得新贴纸！' : '贴纸已解锁'}
          </div>
          <div className={`text-lg font-black ${style.text}`}>{sticker.name}</div>
          <div className={`text-xs ${style.text} opacity-75`}>{RARITY_LABEL[sticker.rarity]} · {sticker.description}</div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 200);
          }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${style.text} opacity-60 hover:opacity-100 transition-opacity`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
