import { useState } from 'react';
import { ALL_STICKERS } from '../data/stickers';
import type { Sticker } from '../types/sticker';
import { Rarity } from '../types/sticker';
import { StickerCard } from './StickerCard';

type Tab = 'all' | Rarity;

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: Rarity.Common, label: '普通' },
  { key: Rarity.Rare, label: '稀有' },
  { key: Rarity.Epic, label: '史诗' },
  { key: Rarity.Legendary, label: '传说' },
];

const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.Common]: 'bg-white/20',
  [Rarity.Rare]: 'bg-blue-500/30',
  [Rarity.Epic]: 'bg-purple-500/30',
  [Rarity.Legendary]: 'bg-yellow-500/30',
};

interface StickerBookProps {
  isUnlocked: (id: string) => boolean;
  newStickerId?: string | null;
}

export function StickerBook({ isUnlocked, newStickerId = null }: StickerBookProps) {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  const filteredStickers =
    activeTab === 'all'
      ? ALL_STICKERS
      : ALL_STICKERS.filter((s) => s.rarity === activeTab);

  const totalCount = ALL_STICKERS.length;
  const unlockedCount = ALL_STICKERS.filter((s) => isUnlocked(s.id)).length;
  const progressPct = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-4">
        {/* 进度条 */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm font-medium">收集进度</span>
            <span className="text-yellow-400 text-sm font-bold">
              {unlockedCount} / {totalCount}
            </span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Tab 栏 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${activeTab === tab.key
                  ? 'bg-yellow-400 text-yellow-900 shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 贴纸网格 */}
        <div className="grid grid-cols-4 gap-2.5">
          {filteredStickers.map((sticker) => (
            <StickerCard
              key={sticker.id}
              sticker={sticker}
              isUnlocked={isUnlocked(sticker.id)}
              isNew={newStickerId === sticker.id}
              onClick={() => {
                if (isUnlocked(sticker.id)) {
                  setSelectedSticker(sticker);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* 详情弹窗 */}
      {selectedSticker && (
        <StickerDetailModal
          sticker={selectedSticker}
          onClose={() => setSelectedSticker(null)}
        />
      )}
    </>
  );
}

function StickerDetailModal({ sticker, onClose }: { sticker: Sticker; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-overlay-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl border-2 border-white/20 bg-gradient-to-b from-white/15 to-white/5 p-6 flex flex-col items-center gap-4 animate-panel-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 贴纸大图 */}
        <div className={`
          w-28 h-28 rounded-3xl flex items-center justify-center text-7xl
          ${RARITY_COLORS[sticker.rarity]}
        `}>
          {sticker.image}
        </div>

        {/* 名称 */}
        <div className="text-center">
          <h3 className="text-xl font-black text-white">{sticker.name}</h3>
          <p className="text-white/50 text-sm mt-1">{sticker.description}</p>
        </div>

        {/* 稀有度 */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          sticker.rarity === Rarity.Common ? 'bg-white/20 text-white/80' :
          sticker.rarity === Rarity.Rare ? 'bg-blue-500/30 text-blue-300' :
          sticker.rarity === Rarity.Epic ? 'bg-purple-500/30 text-purple-300' :
          'bg-yellow-500/30 text-yellow-300'
        }`}>
          {sticker.rarity}
        </div>

        {/* 解锁提示 */}
        <div className="text-center text-white/40 text-xs">
          <span className="opacity-60">{sticker.unlockHint}</span>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 font-semibold text-sm transition-all active:scale-95"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
