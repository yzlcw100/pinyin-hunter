import React, { useEffect, useState } from 'react';

interface ScorePopupProps {
  score: number;          // 本次得分增量（如 +10, +5）
  x?: number;             // 弹出位置 X（px，默认居中）
  y?: number;             // 弹出位置 Y（px，默认屏幕上1/3处）
  trigger: boolean;       // 触发信号（每 true 一次弹一次）
  onComplete?: () => void;
}

/**
 * 得分飘字组件
 * 分数从底部向上飘出并逐渐消失
 */
export function ScorePopup({ score, x, y, trigger, onComplete }: ScorePopupProps) {
  const [active, setActive] = useState(false);
  const [currentScore, setCurrentScore] = useState(score);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!trigger) return;

    setCurrentScore(score);
    setActive(true);

    timerRef.current = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger, score, onComplete]);

  if (!active) return null;

  const displayX = x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
  const displayY = y ?? (typeof window !== 'undefined' ? window.innerHeight * 0.35 : 200);

  const isBonus = score > 10;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: displayX,
        top: displayY,
        transform: 'translate(-50%, -50%)',
        animation: `score-pop 900ms cubic-bezier(0, 0, 0.2, 1) both`,
      }}
    >
      <div
        className={`font-black text-4xl drop-shadow-lg text-center whitespace-nowrap ${
          isBonus ? 'text-yellow-300' : 'text-green-400'
        }`}
        style={{
          textShadow: isBonus
            ? '0 0 20px rgba(255,200,0,0.8), 0 2px 4px rgba(0,0,0,0.5)'
            : '0 0 12px rgba(76,175,80,0.8), 0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {currentScore > 0 ? `+${currentScore}` : currentScore}
      </div>
      {isBonus && (
        <div
          className="text-center text-xs font-bold text-yellow-200 mt-1"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          连击加成！
        </div>
      )}
    </div>
  );
}

/* ─── 得分板弹跳数字 ──────────────────────────────────────── */
interface ScoreBounceProps {
  score: number;
  className?: string;
}

export function ScoreBounce({ score, className = '' }: ScoreBounceProps) {
  const [bounce, setBounce] = useState(false);
  const prevScore = React.useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 400);
      return () => clearTimeout(t);
    }
  }, [score]);

  return (
    <span
      className={`inline-block ${className}`}
      style={{
        animation: bounce ? 'score-bounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
      }}
    >
      {score}
    </span>
  );
}
