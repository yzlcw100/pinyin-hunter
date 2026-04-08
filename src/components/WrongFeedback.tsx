import React from 'react';

/* ─── X 图标 ─────────────────────────────────────────────── */
function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#FF5252" />
      <path
        d="M8 8L16 16M16 8L8 16"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface WrongFeedbackProps {
  show: boolean;
  shakeTarget?: React.RefObject<HTMLElement | null>;
  onAnimationEnd?: () => void;
}

/**
 * 错误答案反馈动画
 * - 水平抖动
 * - 右上角 X 图标出现
 * - 屏幕震动（通过 shakeTarget 的 ref 附加类名）
 */
export function WrongFeedback({ show, onAnimationEnd }: WrongFeedbackProps) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
      onAnimationEnd={onAnimationEnd}
    >
      {/* 全屏淡红遮罩 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 82, 82, 0.06)',
          animation: `overlay-fade 200ms ease both`,
        }}
      />
    </div>
  );
}

/* ─── 选项内 X 图标 ──────────────────────────────────────── */
interface OptionXProps {
  delay?: number;
}

export function OptionX({ delay = 0 }: OptionXProps) {
  return (
    <div
      className="absolute top-2 right-2"
      style={{
        animation: `x-appear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`,
      }}
    >
      <XIcon />
    </div>
  );
}
