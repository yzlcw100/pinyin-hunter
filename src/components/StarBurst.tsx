import { useEffect, useRef, useState } from 'react';

interface StarBurstProps {
  trigger: boolean;       // 触发爆发
  x: number;               // 爆发中心 X（px）
  y: number;               // 爆发中心 Y（px）
  count?: number;          // 星星数量，默认 8
  onComplete?: () => void;
}

/**
 * 星星爆发粒子效果
 * 从点击位置扩散爆发多个星星粒子
 */
export function StarBurst({ trigger, x, y, count = 8, onComplete }: StarBurstProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; angle: number; distance: number; size: number; rotation: number; delay: number }>
  >([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!trigger) return;

    // 生成粒子
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (360 / count) * i + Math.random() * 20 - 10,
      distance: 50 + Math.random() * 60,
      size: 12 + Math.random() * 12,
      rotation: Math.random() * 360,
      delay: Math.random() * 80,
    }));
    setParticles(newParticles);

    // 动画完成后清理
    timerRef.current = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger, count, onComplete]);

  if (!trigger || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              animation: `star-burst 600ms cubic-bezier(0.4, 0, 1, 1) ${p.delay}ms both`,
              // 用 CSS 变量传递粒子目标位置
              // animation 用 keyframes 直接控制，所以这里不用 --tx/ty
            }}
          >
            <div
              style={{
                width: p.size,
                height: p.size,
                transform: `translate(${tx * 0.5}px, ${ty * 0.5}px) rotate(${p.rotation}deg)`,
                animation: `comet-tail 500ms ease-out ${p.delay}ms both`,
                // 直接内联位移
              }}
            >
              <StarShape size={p.size} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── 星星形状 SVG ─────────────────────────────────────────── */
function StarShape({ size = 20, color = '#FFD700' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ─── 独立星星爆发（无坐标，用 absolute） ─────────────────── */
interface StarParticleProps {
  x: number;
  y: number;
  index: number;
  total?: number;
}

export function StarParticle({ x, y, index, total = 8 }: StarParticleProps) {
  const size = 10 + Math.random() * 10;
  void total; // used by parent for particle count

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        animation: `star-burst 600ms cubic-bezier(0.4, 0, 1, 1) ${index * 40}ms both`,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          animation: `comet-tail 450ms ease-out ${index * 40}ms both`,
          // comet-tail 用 CSS var
        }}
      >
        <StarShape size={size} />
      </div>
    </div>
  );
}
