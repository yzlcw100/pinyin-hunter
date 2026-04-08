/**
 * 练习页 PracticePage
 * 离线练习模式：不限时、不限生命，可反复练习任意音节
 * 路由：/practice
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameButton } from '../components/GameButton';
import { speakPinyin } from '../utils/audioUtils';

interface PracticePageProps {
  onBack?: () => void;
}

export function PracticePage({ onBack }: PracticePageProps) {
  const navigate = useNavigate();
  const { currentQuestion, checkAnswer, nextQuestion } = useGameStore();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null) return;

    setSelectedIndex(index);
    setSessionTotal((p) => p + 1);

    const correct = checkAnswer(index);
    setIsCorrect(correct);
    if (correct) {
      setSessionCorrect((p) => p + 1);
    }
  }, [selectedIndex, checkAnswer]);

  const handleNext = useCallback(() => {
    setSelectedIndex(null);
    setIsCorrect(null);
    setShowHint(false);
    nextQuestion();
  }, [nextQuestion]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 max-w-2xl mx-auto overscroll-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 48px)' }}
    >
      {/* ─── 顶部导航栏 ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors active:scale-95 touch-manipulation"
        >
          <span className="text-xl">←</span>
          <span className="text-sm font-medium">返回</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-white/60 text-xs sm:text-sm">
            正确率 <span className="text-green-400 font-bold">{accuracy}%</span>
          </span>
          <span className="text-white/40 text-xs sm:text-sm">
            {sessionCorrect}/{sessionTotal}
          </span>
        </div>
      </div>

      {/* ─── 练习模式提示 ─────────────────────────────────── */}
      <div className="bg-blue-500/15 border border-blue-500/30 rounded-xl px-4 py-2 text-center">
        <p className="text-blue-300 text-xs sm:text-sm font-medium">
          🎯 练习模式 · 不限时 · 不限生命 · 随意切换
        </p>
      </div>

      {/* ─── 拼音展示 ─────────────────────────────────────── */}
      {currentQuestion && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
          <div className="text-center">
            <p className="text-white/40 text-xs sm:text-sm mb-3">请选择正确的汉字</p>
            <div
              className="bg-white/10 rounded-3xl px-8 sm:px-12 py-5 sm:py-7 ring-1 ring-white/10 cursor-pointer active:scale-95 transition-transform touch-manipulation"
              onClick={() => speakPinyin(currentQuestion.displayPinyin)}
            >
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

          {/* ─── 选项区 ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = selectedIndex === i;
              const isRightAnswer = i === currentQuestion.correctIndex;

              let btnClass = `
                relative w-full min-h-[60px] p-3 sm:p-5 rounded-2xl text-center
                text-2xl sm:text-3xl md:text-4xl font-black tracking-wider
                select-none outline-none border-2 transition-all duration-150
                touch-manipulation active:scale-95
              `;

              if (selectedIndex === null) {
                btnClass += ' bg-white/10 border-white/20 text-white hover:bg-white/20';
              } else if (isSelected) {
                btnClass += isCorrect
                  ? ' bg-green-500/30 border-green-400 text-green-300'
                  : ' bg-red-500/30 border-red-400 text-red-300';
              } else if (isRightAnswer) {
                btnClass += ' bg-green-500/20 border-green-400/60 text-green-300/80';
              } else {
                btnClass += ' bg-white/5 border-white/10 text-white/30 opacity-50';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={selectedIndex !== null}
                  className={btnClass}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* ─── 提示按钮 ───────────────────────────────── */}
          {selectedIndex === null && (
            <button
              onClick={() => setShowHint((p) => !p)}
              className="text-blue-400/70 hover:text-blue-300 text-xs sm:text-sm underline active:scale-95 touch-manipulation"
            >
              {showHint ? '隐藏提示' : '显示提示'}
            </button>
          )}

          {showHint && !selectedIndex && (
            <p className="text-white/40 text-sm animate-page-enter">
              💡 提示：音节为 <span className="text-yellow-300">{currentQuestion.displayPinyin}</span>
            </p>
          )}

          {/* ─── 反馈 & 下一题 ──────────────────────────── */}
          {selectedIndex !== null && (
            <div className="flex flex-col items-center gap-3 animate-page-enter">
              {isCorrect ? (
                <p className="text-green-400 font-bold text-xl sm:text-2xl">✅ 正确！</p>
              ) : (
                <p className="text-red-400 font-bold text-lg sm:text-xl">
                  ❌ 错误！答案是：{currentQuestion.options[currentQuestion.correctIndex]}
                </p>
              )}
              <GameButton variant="primary" size="lg" onClick={handleNext} className="min-h-[60px] text-lg">
                下一题 →
              </GameButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
