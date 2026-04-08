interface ProgressBarProps {
  current: number;   // 当前进度
  total: number;     // 总量
  color?: 'yellow' | 'blue' | 'green' | 'red';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  color = 'yellow',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const colorClasses = {
    yellow: 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-yellow-500/50',
    blue: 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-500/50',
    green: 'bg-gradient-to-r from-green-400 to-green-500 shadow-green-500/50',
    red: 'bg-gradient-to-r from-red-400 to-red-500 shadow-red-500/50',
  };

  const trackColor = {
    yellow: 'bg-yellow-900/30',
    blue: 'bg-blue-900/30',
    green: 'bg-green-900/30',
    red: 'bg-red-900/30',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-white/60">进度</span>
          <span className="text-xs font-bold text-white/80">
            {current}/{total}
          </span>
        </div>
      )}
      <div
        className={`
          relative w-full rounded-full overflow-hidden
          h-3 bg-opacity-30 ${trackColor[color]}
        `}
        style={{ height: '12px', backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {/* 渐变填充条 */}
        <div
          className={`
            h-full rounded-full transition-all duration-500 ease-out
            shadow-lg ${colorClasses[color]}
          `}
          style={{ width: `${percentage}%` }}
        />
        {/* 闪光动画 */}
        <div
          className="absolute top-0 h-full rounded-full opacity-30 animate-pulse"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          }}
        />
      </div>
      {/* 百分比数字 */}
      {showLabel && (
        <div className="text-right mt-1">
          <span className="text-xs text-white/40">{percentage}%</span>
        </div>
      )}
    </div>
  );
}

// ─── 组合进度条（带生命值、连击等） ────────────────────────────

interface ComboProgressBarProps {
  combo: number;
  nextBonus: number; // 触发下一个加成的连击数
  className?: string;
}

export function ComboMeter({ combo, className = '' }: ComboProgressBarProps) {
  const milestones = [2, 3, 5];
  const currentMilestone = milestones.find((m) => combo < m) ?? 5;
  const prevMilestone = milestones.filter((m) => m <= combo).pop() ?? 0;
  const progress = (combo - prevMilestone) / (currentMilestone - prevMilestone);

  const bonusLabels: Record<number, string> = {
    2: '+2',
    3: '+5',
    5: '+10',
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/60">连击加成</span>
        <span className="text-xs font-bold text-yellow-400">
          {combo >= 5 ? 'MAX!' : `${combo}/${currentMilestone} → ${bonusLabels[currentMilestone]}`}
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden h-2"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-400"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
