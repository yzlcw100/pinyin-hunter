import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameButton } from '../components/GameButton';
import { ProgressBar } from '../components/ProgressBar';
import { LivesDisplay } from '../components/HeartLost';
import { ComboBadge } from '../components/ComboEffect';
import { ScorePopup } from '../components/ScorePopup';
import { ComboEffect } from '../components/ComboEffect';
import { OptionTick } from '../components/CorrectFeedback';
import { OptionX } from '../components/WrongFeedback';
import { StarBurst } from '../components/StarBurst';
import {
  useAudio,
  speakPinyin,
} from '../utils/audioUtils';

interface GamePageProps {
  onFinish: () => void;
}

// ─── 横屏提示组件 ───────────────────────────────────────────────
function LandscapePrompt() {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-6 p-8 landscape-only:block hidden">
      <div className="text-7xl animate-bounce">📱</div>
      <p className="text-white text-xl font-bold text-center">请将设备旋转至横屏</p>
      <p className="text-white/60 text-sm text-center">横屏体验更佳，获得更宽的游戏视野</p>
      <div className="text-5xl">↻</div>
    </div>
  );
}

// ─── 移动端检测 ───────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 1024
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ─── 竖屏检测（仅移动端） ─────────────────────────────────────
function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );
  useEffect(() => {
    const handler = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    // 也监听 orientationchange
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);
  return isPortrait;
}

export function GamePage({ onFinish }: GamePageProps) {
  const {
    currentQuestion,
    score,
    combo,
    lives,
    questionIndex,
    totalQuestions,
    checkAnswer,
    nextQuestion,
    level,
  } = useGameStore();

  const audio = useAudio();
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();

  // 显示横屏提示（仅移动端竖屏时）
  const showLandscapePrompt = isMobile && isPortrait;

  // ─── 动画状态 ────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [canInteract, setCanInteract] = useState(true);

  // 关卡完成过渡动画（答完最后一题后、结果页前）
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  // 得分飘字
  const [scorePopup, setScorePopup] = useState({ trigger: false, score: 0, x: 0, y: 0 });

  // 星星爆发
  const [starBurst, setStarBurst] = useState({ trigger: false, x: 0, y: 0 });

  // 上一题连击（用于 combo break）
  const prevComboRef = useRef(combo);

  // 当前分数快照（计算增量）
  const prevScoreRef = useRef(score);

  // 选项按钮 ref（用于获取点击位置）
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 屏幕震动 ref
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // 连击音效防抖
  const comboPlayedRef = useRef(0);

  // ─── 题目切换：重置状态 ─────────────────────────────────────
  useEffect(() => {
    setSelectedIndex(null);
    setIsCorrect(null);
    setCanInteract(true);
    prevScoreRef.current = score;
    comboPlayedRef.current = combo;
  }, [currentQuestion?.syllable.id]);

  // ─── 答对：播放拼音 TTS ─────────────────────────────────────
  useEffect(() => {
    if (isCorrect === true && currentQuestion) {
      const t = setTimeout(() => {
        speakPinyin(currentQuestion.syllable.marked);  // Tingting 真人发音读拼音
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isCorrect, currentQuestion]);

  // ─── 选项点击处理 ───────────────────────────────────────────
  const handleSelect = useCallback((index: number) => {
    if (!canInteract || selectedIndex !== null) return;

    const btn = optionRefs.current[index];
    const rect = btn?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    audio.playClick();

    setSelectedIndex(index);
    setCanInteract(false);

    const correct = checkAnswer(index);
    setIsCorrect(correct);

    if (correct) {
      const delta = score - prevScoreRef.current;
      prevScoreRef.current = score;

      setStarBurst({ trigger: true, x: cx, y: cy });
      setScorePopup({ trigger: true, score: delta > 0 ? delta : 10, x: cx, y: cy });
      audio.playCorrect();

      if (combo > comboPlayedRef.current) {
        comboPlayedRef.current = combo;
        setTimeout(() => audio.playCombo(combo), 100);
      }

      // 最后一题答对：显示关卡完成过渡动画
      if (questionIndex >= totalQuestions) {
        setShowLevelComplete(true);
        setTimeout(() => {
          setShowLevelComplete(false);
          nextQuestion();
        }, 2000);
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 1200);
      }
    } else {
      if (gameAreaRef.current) {
        gameAreaRef.current.classList.add('animate-screen-shake');
        setTimeout(() => {
          gameAreaRef.current?.classList.remove('animate-screen-shake');
        }, 450);
      }

      audio.playWrong();

      // 最后一题答错：同样显示过渡
      if (questionIndex >= totalQuestions) {
        setShowLevelComplete(true);
        setTimeout(() => {
          setShowLevelComplete(false);
          nextQuestion();
        }, 2000);
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 1600);
      }
    }
  }, [canInteract, selectedIndex, checkAnswer, nextQuestion, audio, combo, score]);

  // ─── 得分飘字重置 ───────────────────────────────────────────
  const handleScorePopupComplete = useCallback(() => {
    setScorePopup((p) => ({ ...p, trigger: false }));
  }, []);

  const handleStarBurstComplete = useCallback(() => {
    setStarBurst((p) => ({ ...p, trigger: false }));
  }, []);

  // ─── 渲染 ─────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">加载中...</p>
      </div>
    );
  }

  const getOptionStyle = (index: number) => {
    const base = `
      relative w-full min-h-[60px] p-3 sm:p-5 rounded-2xl text-center
      text-2xl sm:text-3xl md:text-4xl font-black tracking-wider
      select-none outline-none border-2
      transition-all duration-150
      touch-manipulation
    `;

    if (selectedIndex === null) {
      // 默认状态：触摸按下缩小
      return `${base} bg-white/10 border-white/20 text-white active:scale-95 active:bg-white/20 active:border-white/40`;
    }

    if (index === selectedIndex) {
      if (isCorrect) {
        return `${base} bg-green-500/30 border-green-400 text-green-300 shadow-lg shadow-green-500/30 animate-correct-flash`;
      } else {
        return `${base} bg-red-500/30 border-red-400 text-red-300 shadow-lg shadow-red-500/30 animate-wrong-shake`;
      }
    }

    if (index === currentQuestion.correctIndex && !isCorrect) {
      return `${base} bg-green-500/20 border-green-400/60 text-green-300/80 animate-correct-reveal`;
    }

    return `${base} bg-white/5 border-white/10 text-white/30 opacity-50`;
  };

  const getOptionContent = (index: number) => {
    const opt = currentQuestion.options[index];

    if (index === selectedIndex && isCorrect === true) {
      return (
        <span className="relative inline-flex items-center justify-center w-full">
          <span>{opt}</span>
          <OptionTick />
        </span>
      );
    }

    if (index === selectedIndex && isCorrect === false) {
      return (
        <span className="relative inline-flex items-center justify-center w-full">
          <span>{opt}</span>
          <OptionX />
        </span>
      );
    }

    if (index === currentQuestion.correctIndex && !isCorrect && selectedIndex !== null) {
      return (
        <span className="relative inline-flex items-center justify-center w-full">
          <span>{opt}</span>
          <OptionTick />
        </span>
      );
    }

    return opt;
  };

  return (
    <>
      {/* 横屏提示（仅移动端竖屏时） */}
      {showLandscapePrompt && <LandscapePrompt />}

      <div
        ref={gameAreaRef}
        className={`
          min-h-screen min-h-[100dvh] flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 md:p-6
          max-w-2xl mx-auto
          animate-game-enter
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* ─── 顶部状态栏 ─────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">
          {/* 题号 */}
          <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px] text-center">
            <span className="text-white font-bold text-base sm:text-lg">
              {questionIndex}/{totalQuestions}
            </span>
          </div>

          {/* 分数 */}
          <div className="bg-yellow-500/20 rounded-xl px-3 sm:px-4 py-2 ring-1 ring-yellow-500/30 min-w-[60px] text-center">
            <span className="text-yellow-400 font-black text-lg sm:text-xl">{score}</span>
          </div>

          {/* 生命值 */}
          <LivesDisplay lives={lives} maxLives={3} />
        </div>

        {/* ─── 进度条 ─────────────────────────────────────── */}
        <ProgressBar
          current={questionIndex}
          total={totalQuestions}
          color="yellow"
          showLabel={false}
        />

        {/* ─── 连击指示 ───────────────────────────────────── */}
        {combo > 0 && (
          <div className="flex justify-center">
            <ComboBadge combo={combo} />
          </div>
        )}

        {/* ─── 拼音展示区 ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-5 py-2 sm:py-4">
          <div className="text-center">
            <p className="text-white/40 text-xs sm:text-sm mb-2">请选择正确的汉字</p>
            <div
              className="
                bg-white/10 rounded-3xl px-6 sm:px-10 py-4 sm:py-6
                ring-1 ring-white/10 cursor-pointer
                active:scale-95 transition-transform
                touch-manipulation
              "
              onClick={() => currentQuestion && speakPinyin(currentQuestion.syllable.marked)}
              title="点击听发音"
            >
              {/* 响应式字号：手机 48px → iPad 64-80px → 大屏 96px */}
              <p className="
                text-pinyin-sm sm:text-pinyin-md lg:text-pinyin-lg xl:text-pinyin-xl
                font-black text-white tracking-widest select-none
                leading-none
              ">
                {currentQuestion.displayPinyin}
              </p>
            </div>
            <p className="text-white/30 text-xs mt-2">点击可听发音</p>
          </div>

          {/* ─── 选项区（响应式） ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg">
            {currentQuestion.options.map((_opt, i) => (
              <button
                key={i}
                ref={(el) => { optionRefs.current[i] = el; }}
                onClick={() => handleSelect(i)}
                disabled={!canInteract}
                className={getOptionStyle(i)}
                style={{
                  animation: !selectedIndex
                    ? `option-enter 250ms cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both`
                    : undefined,
                }}
              >
                {getOptionContent(i)}
              </button>
            ))}
          </div>

          {/* ─── 反馈文字 ───────────────────────────────── */}
          {selectedIndex !== null && (
            <div className="text-center h-8 animate-page-enter">
              {isCorrect ? (
                <p className="text-green-400 font-bold text-lg sm:text-xl">✅ 正确！</p>
              ) : (
                <p className="text-red-400 font-bold text-lg sm:text-xl">
                  ❌ 错误！答案是：{currentQuestion.options[currentQuestion.correctIndex]}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ─── 底部操作（iOS 安全区） ────────────────────── */}
        <div className="flex justify-center pt-1">
          <GameButton variant="ghost" size="sm" onClick={onFinish}>
            退出游戏
          </GameButton>
        </div>

        {/* ─── 动画叠加层 ─────────────────────────────────── */}
        <ComboEffect combo={combo} prevCombo={prevComboRef.current} />

        {scorePopup.trigger && (
          <ScorePopup
            key={`popup-${questionIndex}-${selectedIndex}`}
            score={scorePopup.score}
            x={scorePopup.x}
            y={scorePopup.y}
            trigger={scorePopup.trigger}
            onComplete={handleScorePopupComplete}
          />
        )}

        {starBurst.trigger && (
          <StarBurst
            trigger={starBurst.trigger}
            x={starBurst.x}
            y={starBurst.y}
            count={8}
            onComplete={handleStarBurstComplete}
          />
        )}

        {/* ─── 关卡完成过渡动画 ─────────────────────────── */}
        {showLevelComplete && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <p className="text-white/80 text-xl font-bold animate-bounce">
              第{level}关 · 已完成！
            </p>
            <div className="text-6xl animate-scale-in">🎉</div>
            <p className="text-yellow-400 text-4xl font-black">
              {score}分
            </p>
            <div className="flex gap-2 text-4xl">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="text-yellow-400 animate-star-pop" style={{ animationDelay: `${i * 150}ms` }}>
                  ★
                </span>
              ))}
            </div>
            <p className="text-white/40 text-sm">正在进入成绩页面...</p>
          </div>
        )}
      </div>
    </>
  );
}
