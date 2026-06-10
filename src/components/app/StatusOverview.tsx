import { ui } from "../../lib/ui";

interface StatusOverviewProps {
  autoDrawEnabled: boolean;
  boothCount: number;
  catalogStatus: string;
  doorCount: number;
  floorPlanStatus: string;
  gridVisible: boolean;
  onAutoDrawChange: (enabled: boolean) => void;
  onGridVisibleChange: (visible: boolean) => void;
  onShowLabelsChange: (show: boolean) => void;
  showLabels: boolean;
  walkwayCount: number;
}

export function StatusOverview({
  autoDrawEnabled,
  boothCount,
  catalogStatus,
  doorCount,
  floorPlanStatus,
  gridVisible,
  onAutoDrawChange,
  onGridVisibleChange,
  onShowLabelsChange,
  showLabels,
  walkwayCount,
}: StatusOverviewProps) {
  return (
    <section className={`${ui.panel} grid gap-3`}>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Total booths</span>
        <strong className={ui.statsValue}>{boothCount}</strong>
      </div>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Navigation</span>
        <strong className={ui.statsValue}>
          {walkwayCount} walkways / {doorCount} doors
        </strong>
      </div>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Catalog</span>
        <strong className={ui.statsValue}>{catalogStatus}</strong>
      </div>
      <div className={ui.softCard}>
        <span className={ui.statsLabel}>Floor plan</span>
        <strong className={ui.statsValue}>{floorPlanStatus}</strong>
      </div>
      <div className={ui.switchRow}>
        <label className="inline-flex items-center gap-2">
          <input
            checked={autoDrawEnabled}
            className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-sky-400 focus:ring-sky-400/40"
            onChange={(event) => onAutoDrawChange(event.target.checked)}
            type="checkbox"
          />
          Auto draw PDF
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            checked={gridVisible}
            className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-sky-400 focus:ring-sky-400/40"
            onChange={(event) => onGridVisibleChange(event.target.checked)}
            type="checkbox"
          />
          Grid
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            checked={showLabels}
            className="h-4 w-4 rounded border-white/20 bg-slate-900/60 text-sky-400 focus:ring-sky-400/40"
            onChange={(event) => onShowLabelsChange(event.target.checked)}
            type="checkbox"
          />
          Labels
        </label>
      </div>
    </section>
  );
}
