import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { LEVEL_CONFIGS, STATS } from '../data/pinyinData';
import { GameButton } from '../components/GameButton';
import { loadProgress, getCompletedLevelCount } from '../utils/storageUtils';
import type { GameLevel } from '../utils/storageUtils';
import { playClickSound } from '../utils/audioUtils';
import { APP_VERSION } from '../version';
import { useStickerCollection, canFreeDraw, freeDrawCountdown } from '../hooks/useStickerCollection';
import { StickerToast } from '../components/StickerToast';
import type { Sticker } from '../types/sticker';

interface HomePageProps {
  onStartGame: () => void;
}

function StarDisplay({ stars }: { stars: number }) {
  return (
    <span className="text-base">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block ${i < stars ? 'text-yellow-400' : 'text-white/20'}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function LockIcon() {
  return <span className="text-white/30 text-lg">🔒</span>;
}

const LEVEL_COLORS: Record<GameLevel, { bg: string; icon: string; text: string }> = {
  1: { bg: 'from-green-500/15 to-green-600/10', icon: 'bg-green-500/20 text-green-400', text: 'text-green-300' },
  2: { bg: 'from-yellow-500/15 to-yellow-600/10', icon: 'bg-yellow-500/20 text-yellow-400', text: 'text-yellow-300' },
  3: { bg: 'from-red-500/15 to-red-600/10', icon: 'bg-red-500/20 text-red-400', text: 'text-red-300' },
  4: { bg: 'from-purple-500/15 to-purple-600/10', icon: 'bg-purple-500/20 text-purple-400', text: 'text-purple-300' },
};

const LEVEL_EMOJIS: Record<GameLevel, string> = {
  1: '🌱', 2: '🌿', 3: '🌳', 4: '🏆',
};

export function HomePage({ onStartGame }: HomePageProps) {
  const navigate = useNavigate();
  const { level, setLevel, unlockedLevels, highScore } = useGameStore();
  const { grantFreeSticker, collection: stickerCollection, progress: stickerProgress } = useStickerCollection();
  const [soundMuted, setSoundMuted] = useState(() => {
    try {
      const raw = localStorage.getItem('pinyin_audio_muted');
      if (raw) return JSON.parse(raw).muted ?? false;
    } catch {}
    return false;
  });
  const [freeDrawResult, setFreeDrawResult] = useState<{ sticker: Sticker; isNew: boolean } | null>(null);
  const [cd, setCd] = useState(0);

  const hasFree = canFreeDraw(stickerCollection);

  useEffect(() => {
    setCd(freeDrawCountdown(stickerCollection));
    const id = setInterval(() => setCd(freeDrawCountdown(stickerCollection)), 1000);
    return () => clearInterval(id);
  }, [stickerCollection]);

  const handleFreeDraw = () => {
    playClickSound();
    const result = grantFreeSticker();
    if (result) setFreeDrawResult(result);
  };

  const cdHours = Math.floor(cd / 3600);
  const cdMin = Math.floor((cd % 3600) / 60);
  const cdSec = cd % 60;

  const progress = loadProgress();
  const records = progress.levelRecords;
  const completedCount = getCompletedLevelCount(records);

  const handleMuteToggle = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    try {
      localStorage.setItem('pinyin_audio_muted', JSON.stringify({ muted: next }));
    } catch {}
    try { (window as unknown as Record<string, boolean>).__pinyin_muted = next; } catch {}
    playClickSound();
  };

  const handleLevelSelect = (lvl: GameLevel) => {
    if (!unlockedLevels.has(lvl)) return;
    setLevel(lvl);
    playClickSound();
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center gap-4 sm:gap-5 p-4 sm:p-6 pb-12 relative overscroll-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 48px)' }}>
      {/* ─── 音效开关（右上角）─────────────────────────────── */}
      <button
        onClick={handleMuteToggle}
        className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-xl transition-all active:scale-90 touch-manipulation"
        title={soundMuted ? '开启音效' : '关闭音效'}
      >
        {soundMuted ? '🔇' : '🔊'}
      </button>

      {/* ─── 标题 ───────────────────────────────────────── */}
      <div className="text-center space-y-1">
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-lg">
          拼音学习乐园
        </h1>
        <p className="text-white/50 text-base">选择关卡，开始挑战</p>
      </div>

      {/* ─── 总进度条 ─────────────────────────────────────── */}
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-white/60 text-sm font-medium">总进度</span>
          <span className="text-yellow-400 text-sm font-bold">
            {completedCount} / 4 关卡通关
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* ─── 最高分 ───────────────────────────────────────── */}
      {highScore > 0 && (
        <div className="text-center">
          <span className="text-yellow-400 font-black text-2xl">🏆 {highScore}</span>
          <p className="text-white/30 text-xs mt-0.5">历史最高分</p>
        </div>
      )}

      {/* ─── 关卡卡片（2×2，响应式）──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-md px-0 sm:px-2">
        {LEVEL_CONFIGS.map((config) => {
          const lvl = config.level as GameLevel;
          const isUnlocked = unlockedLevels.has(lvl);
          const isSelected = level === lvl;
          const record = records[lvl];
          const stars = record?.stars ?? 0;
          const colors = LEVEL_COLORS[lvl];

          return (
            <button
              key={config.level}
              onClick={() => handleLevelSelect(lvl)}
              disabled={!isUnlocked}
              className={`
                relative w-full p-4 rounded-2xl text-left transition-all duration-200
                ${isUnlocked
                  ? isSelected
                    ? `bg-gradient-to-br ${colors.bg} ring-2 ring-yellow-400/60 shadow-xl`
                    : 'bg-white/10 hover:bg-white/15 ring-1 ring-white/10 hover:ring-white/20 active:scale-95 touch-manipulation'
                  : 'bg-white/5 ring-1 ring-white/5 cursor-not-allowed opacity-60 touch-manipulation'
                }
              `}
            >
              {isSelected && isUnlocked && (
                <span className="absolute top-2 right-2 text-yellow-400 text-sm">✓</span>
              )}

              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                  <LockIcon />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors.icon}`}>
                    {LEVEL_EMOJIS[lvl]}
                  </div>
                  <div>
                    <div className={`font-bold text-base ${isUnlocked ? colors.text : 'text-white/40'}`}>
                      {config.name}
                    </div>
                    <div className={`text-xs ${isUnlocked ? 'text-white/40' : 'text-white/20'}`}>
                      {config.description}
                    </div>
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    <StarDisplay stars={stars} />
                  ) : (
                    <span className="text-white/20 text-sm">未解锁</span>
                  )}
                </div>

                {record && record.bestScore > 0 && (
                  <div className="text-xs text-white/30">
                    最高: {record.bestScore}分 · {record.bestCorrect}/10
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── 开始按钮（最小高度 60px）────────────────── */}
      <GameButton
        variant="primary"
        size="lg"
        onClick={() => {
          playClickSound();
          onStartGame();
        }}
        className="w-full max-w-md min-h-[60px] text-base sm:text-lg"
      >
        🚀 开始挑战 · 第{level}关
      </GameButton>

      {/* ─── 贴纸免费抽 / 收集册入口 ───────────────────── */}
      <div className="w-full max-w-md flex gap-2">
        {/* 免费抽取按钮 */}
        {hasFree ? (
          <button
            onClick={handleFreeDraw}
            className="flex-1 min-h-[52px] rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 ring-2 ring-pink-300/40 text-white font-black text-sm sm:text-base shadow-lg shadow-pink-500/30 transition-all active:scale-95 touch-manipulation"
          >
            🎰 每日免费抽
            <span className="block text-xs opacity-80 font-normal mt-0.5">
              已收集 {stickerProgress.unlocked}/{stickerProgress.total}
            </span>
          </button>
        ) : (
          <button
            disabled
            className="flex-1 min-h-[52px] rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/40 font-semibold text-sm cursor-not-allowed"
          >
            ⏳ 明日再来
            <span className="block text-xs opacity-60 font-normal mt-0.5">
              {cdHours > 0 ? `${cdHours}h ` : ''}{cdMin}分 {cdSec}秒
            </span>
          </button>
        )}

        {/* 贴纸册入口 */}
        <button
          onClick={() => {
            playClickSound();
            navigate('/collection');
          }}
          className="w-[52px] min-h-[52px] rounded-2xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 text-white/80 font-semibold text-sm transition-all active:scale-95 touch-manipulation flex items-center justify-center"
        >
          📖
        </button>
      </div>

      {/* ─── 题库统计 ─────────────────────────────────────── */}
      <div className="text-center text-white/25 text-xs space-y-0.5">
        <p>题库规模：{STATS.totalSyllables} 个音节 / {STATS.totalCharacters} 个汉字</p>
        <p>
          🌱{STATS.byDifficulty.L1} · 🌿{STATS.byDifficulty.L2} · 🌳{STATS.byDifficulty.L3} · 🏆{STATS.byDifficulty.L4}
        </p>
      </div>

      {/* ─── 版本号 ─────────────────────────────────────── */}
      <div className="text-center">
        <span className="text-white/20 text-xs">v{APP_VERSION}</span>
      </div>

      {/* 贴纸免费抽结果 */}
      {freeDrawResult && (
        <StickerToast
          sticker={freeDrawResult.sticker}
          isNew={freeDrawResult.isNew}
          onClose={() => setFreeDrawResult(null)}
        />
      )}
    </div>
  );
}
