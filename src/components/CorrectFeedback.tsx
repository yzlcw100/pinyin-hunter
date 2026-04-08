

interface CorrectFeedbackProps {
  show: boolean;
  onAnimationEnd?: () => void;
}

/**
 * 正确答案反馈动画
 * - 绿色背景 flash
 * - 右上角打勾图标出现
 */
export function CorrectFeedback({ show, onAnimationEnd }: CorrectFeedbackProps) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
      onAnimationEnd={onAnimationEnd}
    >
      {/* 全屏淡绿遮罩 */}
      <div
        className="absolute inset-0 animate-correct-flash"
        style={{
          background: 'rgba(76, 175, 80, 0.08)',
          animationDuration: '400ms',
          animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          animationFillMode: 'forwards',
        }}
      />
    </div>
  );
}

/* ─── 独立打勾图标组件 ─────────────────────────────────────── */
export function TickIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#4CAF50" />
      <path
        d="M7 12.5L10.5 16L17 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── 选项内打勾（absolute 定位） ──────────────────────────── */
interface OptionTickProps {
  delay?: number;
}

export function OptionTick({ delay = 0 }: OptionTickProps) {
  return (
    <div
      className="absolute top-2 right-2"
      style={{
        animation: `tick-appear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`,
      }}
    >
      <TickIcon />
    </div>
  );
}
