import { useGameStore, calculateStars, isLevelPassed } from '../store/gameStore';
import { LEVEL_CONFIGS } from '../data/pinyinData';
import { GameButton } from '../components/GameButton';
import { useStickerCollection } from '../hooks/useStickerCollection';
import { StickerToast } from '../components/StickerToast';
import { useEffect, useState } from 'react';
import type { Sticker } from '../types/sticker';

interface ResultPageProps {
  onReplay: () => void;
  onGoHome: () => void;
  onNextLevel: () => void;
}

const PASS_THRESHOLD = 6;

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={`text-4xl transition-all duration-500 ${i < stars ? 'scale-100 text-yellow-400' : 'scale-75 text-white/20'}`}
          style={{ transitionDelay: `${i * 150}ms` }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ResultPage({ onReplay, onGoHome, onNextLevel }: ResultPageProps) {
  const { grantSticker } = useStickerCollection();
  const [rewardSticker, setRewardSticker] = useState<{ sticker: Sticker; isNew: boolean } | null>(null);

  useEffect(() => {
    const result = grantSticker('level_complete');
    if (result.isNew) {
      setRewardSticker(result);
    }
  }, [grantSticker]);

  const {
    score,
    correctCount,
    wrongCount,
    totalQuestions,
    maxCombo,
    highScore,
    level,
    gameStartTime,
  } = useGameStore();

  const stars = calculateStars(correctCount, totalQuestions);
  const passed = isLevelPassed(correctCount);
  const rate = Math.round((correctCount / totalQuestions) * 100);
  const isNewRecord = score === highScore && score > 0;

  // 计算用时
  const timeSpent = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : null;
  const timeLabel = timeSpent !== null
    ? timeSpent < 60 ? `${timeSpent}秒` : `${Math.floor(timeSpent / 60)}分${timeSpent % 60 > 0 ? (timeSpent % 60) + '秒' : ''}`
    : '--';

  // 下一关
  const levelConfig = LEVEL_CONFIGS.find((c) => c.level === level);
  const hasNextLevel = level < 4;

  // 评级文字
  const rateLabel = rate === 100 ? '满分！完美！' :
    rate >= 90 ? '太棒了！' :
    rate >= 70 ? '很不错！' :
    rate >= 60 ? '还不错！' :
    rate >= 30 ? '继续加油！' : '多练习哦！';

  // 顶部装饰星星背景
  const bgStars = Array.from({ length: 6 }).map((_, i) => (
    <span
      key={i}
      className="absolute text-white/5 text-8xl select-none"
      style={{
        top: `${10 + i * 15}%`,
        left: `${5 + i * 15}%`,
        transform: `rotate(${i * 30}deg)`,
      }}
    >
      ★
    </span>
  ));

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center gap-4 sm:gap-5 p-4 sm:p-6 pb-12 relative overflow-hidden overscroll-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 48px)' }}>
      {/* 背景装饰 */}
      {bgStars}

      {/* ─── 标题 ─────────────────────────────────────── */}
      <div className="text-center relative z-10">
        <h2 className={`text-3xl font-black ${passed ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500' : 'text-white/80'}`}>
          {passed ? '🎉 挑战成功！' : '😢 挑战失败'}
        </h2>
        {isNewRecord && (
          <p className="text-yellow-400 font-bold text-lg animate-pulse mt-1">🏆 新纪录！</p>
        )}
      </div>

      {/* ─── 星级（大）────────────────────────────────── */}
      <div className="relative z-10">
        <StarRow stars={stars} />
      </div>

      {/* ─── 评级 ─────────────────────────────────────── */}
      <div className="text-center">
        <p className={`text-2xl font-black ${passed ? 'text-yellow-300' : 'text-white/60'}`}>
          {rateLabel}
        </p>
        <p className="text-white/40 text-sm mt-1">
          第{level}关 · {levelConfig?.name}
        </p>
      </div>

      {/* ─── 成绩卡片 ─────────────────────────────────── */}
      <div className="w-full max-w-xs bg-white/10 rounded-3xl p-5 ring-1 ring-white/10 space-y-3 relative z-10">
        {/* 分数 */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-sm">得分</span>
          <span className="text-4xl font-black text-yellow-400">{score}</span>
        </div>
        <div className="h-px bg-white/10" />

        {/* 正确数 */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-sm">正确</span>
          <span className="text-white font-bold text-lg">
            {correctCount}/{totalQuestions}
            <span className="text-green-400 text-sm ml-1.5">({rate}%)</span>
          </span>
        </div>

        {/* 错误数 */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-sm">错误</span>
          <span className="text-red-400 font-bold">{wrongCount}</span>
        </div>

        {/* 用时 */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-sm">用时</span>
          <span className="text-blue-300 font-bold">{timeLabel}</span>
        </div>

        {/* 最高连击 */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-sm">最高连击</span>
          <span className="text-orange-400 font-bold">
            {maxCombo > 0 ? `🔥 ${maxCombo}连` : '--'}
          </span>
        </div>

        {/* 历史最高 */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-sm">历史最高</span>
          <span className="text-yellow-300/80 font-bold">{highScore}</span>
        </div>
      </div>

      {/* ─── 通过状态提示 ─────────────────────────────── */}
      {passed ? (
        <p className="text-green-400 text-sm font-medium relative z-10">
          ✅ 通关成功！答对{correctCount}题，获得{stars}星
        </p>
      ) : (
        <p className="text-red-400 text-sm font-medium relative z-10">
          ❌ 还差{totalQuestions - correctCount}题通关（需答对{PASS_THRESHOLD}题）
        </p>
      )}

      {/* ─── 操作按钮（响应式，最小高度 60px）────────── */}
      <div className="flex flex-col gap-2 sm:gap-2.5 w-full max-w-xs sm:max-w-sm relative z-10">
        {/* 再玩一次 */}
        <GameButton variant="primary" size="lg" onClick={onReplay} className="w-full min-h-[60px] text-base sm:text-lg">
          🔄 再玩一次
        </GameButton>

        {/* 下一关（仅通过且未到最后一关时显示） */}
        {passed && hasNextLevel && (
          <GameButton variant="secondary" size="lg" onClick={onNextLevel} className="w-full min-h-[60px] text-base sm:text-lg">
            ➡️ 下一关 · 第{level + 1}关
          </GameButton>
        )}

        {/* 返回首页 */}
        <GameButton variant="ghost" size="md" onClick={onGoHome} className="w-full">
          🏠 返回首页
        </GameButton>
      </div>

      {/* 贴纸奖励提示 */}
      {rewardSticker && (
        <StickerToast
          sticker={rewardSticker.sticker}
          isNew={rewardSticker.isNew}
          onClose={() => setRewardSticker(null)}
        />
      )}
    </div>
  );
}
