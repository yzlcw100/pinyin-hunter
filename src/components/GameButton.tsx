import React from 'react';

interface GameButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function GameButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: GameButtonProps) {
  const base = `
    relative font-bold rounded-2xl transition-all duration-150
    active:scale-95 active:brightness-90
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    select-none overflow-hidden
  `;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-xl',
  };

  const variantClasses = {
    primary: `
      bg-gradient-to-b from-yellow-400 to-yellow-500
      text-yellow-900 shadow-lg shadow-yellow-500/30
      hover:from-yellow-300 hover:to-yellow-400
      hover:shadow-xl hover:shadow-yellow-500/40
      ring-2 ring-yellow-300 ring-offset-2
    `,
    secondary: `
      bg-gradient-to-b from-blue-400 to-blue-500
      text-white shadow-lg shadow-blue-500/30
      hover:from-blue-300 hover:to-blue-400
      hover:shadow-xl hover:shadow-blue-500/40
      ring-2 ring-blue-300 ring-offset-2
    `,
    danger: `
      bg-gradient-to-b from-red-400 to-red-500
      text-white shadow-lg shadow-red-500/30
      hover:from-red-300 hover:to-red-400
      hover:shadow-xl hover:shadow-red-500/40
      ring-2 ring-red-300 ring-offset-2
    `,
    ghost: `
      bg-white/20 backdrop-blur text-white
      border border-white/30
      hover:bg-white/30
      ring-1 ring-white/20
    `,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          加载中...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
