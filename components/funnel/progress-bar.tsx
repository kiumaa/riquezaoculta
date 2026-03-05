type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const value = total <= 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-soft">
        <span>Progresso</span>
        <span className="font-medium text-brandBright">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/35">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brandDark to-brandBright transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
