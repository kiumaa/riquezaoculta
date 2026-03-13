type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const value = total <= 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Progresso</span>
        <span className="font-semibold tabular-nums text-brandBright">{value}%</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brandDark via-brand to-brandBright transition-all duration-500 [box-shadow:0_0_10px_rgba(32,230,126,0.6)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
