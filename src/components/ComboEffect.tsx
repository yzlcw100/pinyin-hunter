import { useEffect, useRef, useState } from 'react';

interface ComboEffectProps {
  combo: number;        // 当前连击数
  prevCombo: number;    // 上一次连击数（用于检测跳变）
  onComboBreak?: () => void;
}

/**
 * 连击特效组件
 * - combo=0: 无显示
 * - combo=1-2: 基础弹跳
 * - combo=3-5: 蓝色脉冲光圈
 * - combo=6-9: 橙色光晕 + 小星星
 * - combo=10+: 红色狂热 + 屏幕边缘闪光
 */
export function ComboEffect({ combo, prevCombo }: ComboEffectProps) {
  const [showBreak, setShowBreak] = useState(false);
  const [comets, setComets] = useState<Array<{ id: number; tx: number; ty: number; delay: number }>>([]);
  const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 连击中中断
  useEffect(() => {
    if (prevCombo > 0 && combo === 0) {
      setShowBreak(true);
      breakTimerRef.current = setTimeout(() => setShowBreak(false), 300);
    }
    return () => {
      if (breakTimerRef.current) clearTimeout(breakTimerRef.current);
    };
  }, [combo, prevCombo]);

  // 6+ 连击时生成彗星
  useEffect(() => {
    if (combo >= 6) {
      const newComets = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        tx: (Math.random() - 0.5) * 60,
        ty: -20 - Math.random() * 30,
        delay: i * 120,
      }));
      setComets(newComets);
      const t = setTimeout(() => setComets([]), 600);
      return () => clearTimeout(t);
    }
  }, [combo]);

  if (combo === 0 && !showBreak) return null;

  // 中断动画
  if (showBreak) {
    return (
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        style={{ animation: 'combo-break 300ms ease-in forwards' }}
      >
        <div className="text-5xl font-black text-center">
          <span className="text-gray-500">连击中断</span>
        </div>
      </div>
    );
  }

  const level = getComboLevel(combo);
  const colors = COMBO_COLORS[level];

  return (
    <>
      {/* 红色狂热屏幕闪光（10+ 连） */}
      {level === 'fury' && (
        <div
          className="fixed inset-0 pointer-events-none z-30"
          style={{ animation: 'combo-red-flash 800ms ease-out forwards' }}
        />
      )}

      {/* 主连击数字 */}
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center"
        style={{
          animation: `combo-pulse 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
          filter: level === 'fury' ? 'brightness(1.2)' : 'none',
        }}
      >
        {/* 光圈背景 */}
        <div
          className="absolute inset-0 -z-10 rounded-full"
          style={{
            background: colors.glowColor,
            animation:
              level === 'blue'
                ? `combo-blue-ring 600ms ease-out both`
                : level === 'orange'
                ? `combo-orange-glow 600ms ease-out both`
                : 'none',
            filter: 'blur(12px)',
            opacity: 0.5,
          }}
        />

        <div className={`font-black text-5xl drop-shadow-lg ${colors.textColor}`}>
          🔥 {combo}
        </div>
        <div className={`text-sm font-bold mt-1 ${colors.labelColor}`}>
          {level === 'blue' && '连击加成!'}
          {level === 'orange' && '超级连击!'}
          {level === 'fury' && '狂热模式!!'}
        </div>

        {/* 彗星粒子 */}
        {comets.map((c) => (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              animation: `comet-tail 400ms ease-out ${c.delay}ms both`,
              // 用 CSS 变量或直接内联
            }}
          >
            <div style={{ transform: `translate(${c.tx}px, ${c.ty}px)` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.particleColor}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── 辅助函数 ─────────────────────────────────────────────── */
type ComboLevel = 'normal' | 'blue' | 'orange' | 'fury';

const COMBO_COLORS: Record<ComboLevel, { glowColor: string; textColor: string; labelColor: string; particleColor: string }> = {
  normal: {
    glowColor: 'rgba(74, 168, 232, 0.3)',
    textColor: 'text-white',
    labelColor: 'text-blue-300',
    particleColor: '#4AA8E8',
  },
  blue: {
    glowColor: 'rgba(74, 168, 232, 0.5)',
    textColor: 'text-blue-300',
    labelColor: 'text-blue-200',
    particleColor: '#4AA8E8',
  },
  orange: {
    glowColor: 'rgba(255, 140, 66, 0.5)',
    textColor: 'text-orange-400',
    labelColor: 'text-orange-200',
    particleColor: '#FF8C42',
  },
  fury: {
    glowColor: 'rgba(255, 50, 50, 0.6)',
    textColor: 'text-red-400',
    labelColor: 'text-red-200',
    particleColor: '#FF5252',
  },
};

function getComboLevel(combo: number): ComboLevel {
  if (combo >= 10) return 'fury';
  if (combo >= 6) return 'orange';
  if (combo >= 3) return 'blue';
  return 'normal';
}

/* ─── 独立连击数字显示（嵌入 GamePage 用） ────────────────── */
interface ComboBadgeProps {
  combo: number;
}

export function ComboBadge({ combo }: ComboBadgeProps) {
  if (combo <= 1) return null;

  const level = getComboLevel(combo);
  const colors = COMBO_COLORS[level];

  return (
    <div
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-sm"
      style={{
        background: colors.glowColor,
        animation: `combo-pulse 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
      }}
    >
      <span className={colors.textColor}>🔥 {combo}</span>
    </div>
  );
}
