import { useEffect, useRef, useState } from 'react';

interface HeartLostProps {
  lives: number;           // 当前生命值（0-3）
  prevLives: number;       // 上一次生命值（用于检测减少）
  maxLives?: number;       // 最大生命值，默认 3
}

/**
 * 生命值心形消失动画
 * 当 lives < prevLives 时触发坠落动画
 */
export function HeartLost({ lives, prevLives, maxLives = 3 }: HeartLostProps) {
  const [lostIndex, setLostIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevLives > 0 && lives < prevLives) {
      // 心形丢失：lostIndex = 刚消失那颗心的位置（从0开始）
      const idx = lives; // 消失的是原来第 lives 颗（0-indexed）
      setLostIndex(idx);

      timerRef.current = setTimeout(() => {
        setLostIndex(null);
      }, 400);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lives, prevLives]);

  // 生成所有心的状态
  const hearts = Array.from({ length: maxLives }, (_, i) => {
    const isAlive = i < lives;
    const isLostNow = i === lostIndex;
    return { i, isAlive, isLostNow };
  });

  return (
    <div className="flex gap-1">
      {hearts.map(({ i, isAlive, isLostNow }) => (
        <span
          key={i}
          className="text-2xl leading-none"
          style={{
            display: 'inline-block',
            animation: isLostNow
              ? 'heart-fall 350ms ease-in forwards'
              : isAlive
              ? 'none'
              : 'none',
            filter: isAlive ? 'none' : lostIndex === null && i >= lives ? 'grayscale(1)' : 'none',
            opacity: isAlive ? 1 : lostIndex === null && i >= lives ? 0.3 : 1,
          }}
        >
          {isAlive ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  );
}


/* ─── 带动画的独立心形组件 ───────────────────────────────── */
interface AnimatedHeartProps {
  alive: boolean;
  animate?: boolean; // true = 触发坠落
}

export function AnimatedHeart({ alive, animate }: AnimatedHeartProps) {
  return (
    <span
      className="text-2xl leading-none inline-block"
      style={{
        animation: animate && !alive ? 'heart-fall 350ms ease-in forwards' : 'none',
        transition: 'filter 200ms ease',
        filter: alive ? 'none' : 'grayscale(1)',
      }}
    >
      {alive ? '❤️' : '🖤'}
    </span>
  );
}

/* ─── 生命值栏（带数字） ─────────────────────────────────── */
interface LivesDisplayProps {
  lives: number;
  maxLives?: number;
}

export function LivesDisplay({ lives, maxLives = 3 }: LivesDisplayProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: maxLives }, (_, i) => (
        <span
          key={i}
          className="text-xl"
          style={{
            filter: i < lives ? 'none' : 'grayscale(1)',
            opacity: i < lives ? 1 : 0.3,
            transition: 'all 200ms ease',
          }}
        >
          {i < lives ? '❤️' : '🖤'}
        </span>
      ))}
      <span className="text-xs text-white/50 ml-1 font-bold">{lives}/{maxLives}</span>
    </div>
  );
}
